const ALLOWED_ORIGIN = process.env.TRIPO_APP_ORIGIN;
const API_BASE = "https://openapi.tripo3d.ai/v3";
const OPERATION_COST = { island: 30, character: 30, "rig-check": 0, rig: 25, animate: 10 };
const CREDIT_CAP = 95;
const runsByIp = new Map();

async function readJsonBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) { const e=new Error("Request body is too large.");e.status=413;throw e; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { const e=new Error("Invalid JSON request.");e.status=400;throw e; }
}
function send(res,status,body) {
  res.status(status).setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","no-store");
  return res.end(JSON.stringify(body));
}
function originAllowed(req) {
  const origin=req.headers.origin;
  if(!origin)return true;
  try {
    const parsed=new URL(origin),host=String(req.headers.host||"").split(":")[0];
    if(ALLOWED_ORIGIN)return parsed.origin===ALLOWED_ORIGIN;
    return parsed.host.split(":")[0]===host;
  } catch { return false; }
}
function taskIdFrom(req) {
  const value=String(req.query?.taskId||"");
  return /^[0-9a-f-]{20,40}$/i.test(value)?value:"";
}
function clientIp(req) { return String(req.headers["x-forwarded-for"]||"unknown").split(",")[0].trim(); }
async function tripo(path,init={}) {
  const response=await fetch(API_BASE+path,{
    ...init,
    headers:{Authorization:`Bearer ${process.env.TRIPO_API_KEY}`,...(init.headers||{})},
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.code!==0) {
    const e=new Error(data?.message||data?.detail||"Tripo request failed.");
    e.status=response.status||502;
    throw e;
  }
  return data.data;
}
async function createTask(operation,body) {
  let path,payload;
  if(operation==="island"||operation==="character") {
    const prompt=operation==="island"?(typeof body.prompt==="string"?body.prompt.trim():""):
      "A single friendly Christmas elf character, full body, standing upright in a relaxed neutral pose, toy-like stylized low-poly 3D, warm muted red and forest-green clothing with cream trim, small pointed hat, simple face, clean separated limbs suitable for rigging, centered alone, no props, no scenery, no text. Complete biped with both arms and legs clearly visible.";
    if(prompt.length<20||prompt.length>1024){const e=new Error("Prompt must be between 20 and 1024 characters.");e.status=400;throw e;}
    path="/generation/text-to-model";
    payload={prompt,model:"v3.1-20260211",face_limit:operation==="island"?12000:8000,texture:true,pbr:true,smart_low_poly:true};
  } else if(operation==="rig-check") {
    if(!/^[0-9a-f-]{20,40}$/i.test(String(body.characterTaskId||""))){const e=new Error("A valid character generation task is required.");e.status=400;throw e;}
    const source=await tripo("/tasks/"+body.characterTaskId);
    if(source.status!=="success"){const e=new Error("Wait for the character model to finish before checking its rig.");e.status=409;throw e;}
    path="/animations/rig-check";payload={input:body.characterTaskId};
  } else if(operation==="rig") {
    if(!/^[0-9a-f-]{20,40}$/i.test(String(body.characterTaskId||""))){const e=new Error("A valid character generation task is required.");e.status=400;throw e;}
    const source=await tripo("/tasks/"+body.characterTaskId);
    if(source.status!=="success"){const e=new Error("Wait for the character model to finish before rigging.");e.status=409;throw e;}
    path="/animations/rig";payload={input:body.characterTaskId,model:"v3.0-20260909",rig_type:"biped",spec:"mixamo",out_format:"glb"};
  } else if(operation==="animate") {
    if(!/^[0-9a-f-]{20,40}$/i.test(String(body.rigTaskId||""))){const e=new Error("A valid rig task is required.");e.status=400;throw e;}
    const source=await tripo("/tasks/"+body.rigTaskId);
    if(source.status!=="success"){const e=new Error("Wait until rigging is ready before animating.");e.status=409;throw e;}
    path="/animations/retarget";payload={input:body.rigTaskId,animation:"preset:walk"};
  } else {const e=new Error("Unknown generation step.");e.status=400;throw e;}
  return tripo(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
}
module.exports=async function handler(req,res) {
  if(!originAllowed(req))return send(res,403,{error:"Request origin not allowed."});
  if(!process.env.TRIPO_API_KEY)return send(res,503,{error:"TRIPO_API_KEY is missing from this Vercel preview."});
  try {
    if(req.method==="GET"&&req.query?.check==="1") {
      await tripo("/account/balance");
      return send(res,200,{authenticated:true});
    }
    if(req.method==="POST") {
      const body=req.body&&typeof req.body==="object"?req.body:await readJsonBody(req);
      const operation=String(body.operation||"");
      const cost=OPERATION_COST[operation];
      if(cost===undefined)return send(res,400,{error:"Choose a valid generation step."});
      const ip=clientIp(req),now=Date.now();
      let run=runsByIp.get(ip);
      if(!run||now-run.startedAt>24*60*60*1000){run={startedAt:now,steps:new Map(),reserved:0};runsByIp.set(ip,run);}
      if(run.steps.has(operation))return send(res,409,{error:"This step was already submitted for this preview session.",taskId:run.steps.get(operation)});
      if(run.reserved+cost>CREDIT_CAP)return send(res,429,{error:"This run reached the 95-credit cap."});
      run.reserved+=cost;run.steps.set(operation,"pending");
      try {
        const task=await createTask(operation,body);
        run.steps.set(operation,task.task_id);
        return send(res,202,{taskId:task.task_id,status:"queued",reservedCredits:run.reserved,creditCap:CREDIT_CAP});
      } catch(e) {run.reserved-=cost;run.steps.delete(operation);throw e;}
    }
    if(req.method==="GET") {
      const taskId=taskIdFrom(req);
      if(!taskId)return send(res,400,{error:"A valid taskId is required."});
      const task=await tripo("/tasks/"+taskId);
      if(req.query?.download==="1") {
        if(task.status!=="success")return send(res,409,{error:"Model is not ready yet."});
        const modelUrl=task.output?.model_url||task.output?.pbr_model||task.output?.model;
        if(!modelUrl)return send(res,502,{error:"Tripo completed without a downloadable model."});
        const file=await fetch(modelUrl);if(!file.ok)return send(res,502,{error:"Could not download the generated model."});
        const bytes=Buffer.from(await file.arrayBuffer());res.status(200);
        res.setHeader("Content-Type","model/gltf-binary");
        res.setHeader("Content-Disposition",`inline; filename="${req.query?.asset==="character"?"fuzzy-elf-walk":"fuzzy-christmas-island"}.glb"`);
        res.setHeader("Cache-Control","private, no-store");return res.end(bytes);
      }
      return send(res,200,{taskId:task.task_id,status:task.status,progress:task.progress||0,consumedCredits:task.credits_consumed??null,output:task.output||undefined,error:task.status==="failed"?"Tripo could not complete this generation.":undefined});
    }
    res.setHeader("Allow","GET, POST");return send(res,405,{error:"Method not allowed."});
  } catch(error) {
    console.error("Tripo API error:",error.message);
    const status=error.status||502;
    const message=status===401?"Tripo rejected TRIPO_API_KEY. Verify it is an API key from the Tripo Console.":
      status===403?"Tripo denied this API key. Check the key's account access and available credits.":
      error.message||"Tripo request failed.";
    return send(res,status<500?status:502,{error:message});
  }
};
module.exports.config={api:{bodyParser:false}};
