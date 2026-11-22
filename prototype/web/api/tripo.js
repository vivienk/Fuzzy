const ALLOWED_ORIGIN = process.env.TRIPO_APP_ORIGIN;
const API_BASE = "https://api.tripo3d.ai/v2/openapi";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const OPERATION_COST = { island: 40, character: 40, rig: 25, animate: 10 };
const runsByIp = new Map();

async function readImage(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES) { const e = new Error("Reference images must be 20 MB or smaller."); e.status = 413; throw e; }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function readJsonBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) { const e = new Error("Request body is too large."); e.status = 413; throw e; }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { const e = new Error("Invalid JSON request."); e.status = 400; throw e; }
}
function send(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}
function taskIdFrom(req) {
  const value = String(req.query?.taskId || "");
  return /^[0-9a-f-]{20,40}$/i.test(value) ? value : "";
}
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const parsed = new URL(origin), host = String(req.headers.host || "").split(":")[0];
    if (ALLOWED_ORIGIN) return parsed.origin === ALLOWED_ORIGIN;
    return parsed.host.split(":")[0] === host;
  } catch { return false; }
}
async function tripo(path, init = {}) {
  const response = await fetch(API_BASE + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.TRIPO_API_KEY}`, ...(init.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    const e = new Error(data?.message || data?.detail || "Tripo request failed.");
    e.status = response.status || 502; throw e;
  }
  return data.data;
}
async function uploadImage(bytes, contentType) {
  const form = new FormData();
  const extension = contentType === "image/jpeg" ? "jpg" : contentType.slice(6);
  form.append("file", new Blob([bytes], { type: contentType }), "north-pole-reference." + extension);
  const response = await fetch(API_BASE + "/upload/sts", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.TRIPO_API_KEY },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0 || !data.data?.image_token) {
    const e = new Error(data?.message || "Tripo image upload failed."); e.status = response.status || 502; throw e;
  }
  return data.data.image_token;
}
function clientIp(req) { return String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim(); }
async function createTask(operation, body) {
  let payload;
  if (operation === "island") {
    const prompt=typeof body.prompt==="string"?body.prompt.trim():"";
    if (prompt.length<20 || prompt.length>1024) { const e=new Error("Enter an island prompt between 20 and 1024 characters."); e.status=400; throw e; }
    payload = { type:"text_to_model", prompt, model_version:"P1-20260311", face_limit:12000, texture:true, pbr:true };
  } else if (operation === "character") {
    payload = { type:"text_to_model", prompt:"A single friendly Christmas elf character, full body, standing upright in a relaxed neutral pose, toy-like stylized low-poly 3D, warm muted red and forest-green felt clothing with cream trim, small pointed hat, simple face, clean separated limbs suitable for rigging, centered alone, no props, no scenery, no text. Make a complete biped character with both arms and legs clearly visible.", model_version:"P1-20260311", face_limit:8000, texture:true, pbr:true };
  } else if (operation === "rig") {
    if (!/^[0-9a-f-]{20,40}$/i.test(String(body.characterTaskId || ""))) { const e=new Error("A valid character generation task is required.");e.status=400;throw e; }
    const source=await tripo("/task/"+body.characterTaskId);
    if (source.status!=="success") { const e=new Error("Wait until the character model is ready before rigging.");e.status=409;throw e; }
    payload={type:"animate_rig",original_model_task_id:body.characterTaskId,rig_type:"biped",model_version:"v2.0-20250506"};
  } else if (operation === "animate") {
    if (!/^[0-9a-f-]{20,40}$/i.test(String(body.rigTaskId || ""))) { const e=new Error("A valid rig task is required.");e.status=400;throw e; }
    const source=await tripo("/task/"+body.rigTaskId);
    if (source.status!=="success") { const e=new Error("Wait until character rigging is ready before animating.");e.status=409;throw e; }
    payload={type:"animate_retarget",original_model_task_id:body.rigTaskId,animation:"preset:walk",animate_in_place:true,bake_animation:true,out_format:"glb",model_version:"v2.0-20250506"};
  } else { const e=new Error("Unknown generation step.");e.status=400;throw e; }
  return tripo("/task",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
}
module.exports = async function handler(req,res) {
  if (!originAllowed(req)) return send(res,403,{error:"Request origin not allowed."});
  if (!process.env.TRIPO_API_KEY) return send(res,503,{error:"Tripo is not configured. Add TRIPO_API_KEY to the Vercel project environment."});
  try {
    if (req.method==="POST" && req.query?.upload==="1") {
      const type=String(req.headers["content-type"]||"").split(";")[0].toLowerCase();
      if (!IMAGE_TYPES.has(type)) return send(res,415,{error:"Reference image must be PNG, JPEG, or WebP."});
      const bytes=await readImage(req); if(!bytes.length)return send(res,400,{error:"The reference image is empty."});
      return send(res,200,{imageToken:await uploadImage(bytes,type)});
    }
    if (req.method==="POST") {
      const body=req.body&&typeof req.body==="object"?req.body:await readJsonBody(req);
      const operation=String(body.operation||"");
      const cost=OPERATION_COST[operation];
      if (!cost) return send(res,400,{error:"Choose a valid generation step."});
      const ip=clientIp(req), now=Date.now();
      let run=runsByIp.get(ip);
      if (!run || now-run.startedAt>24*60*60*1000) { run={startedAt:now,steps:new Map(),reserved:0}; runsByIp.set(ip,run); }
      if (run.steps.has(operation)) return send(res,409,{error:"This step has already been submitted for this preview session.",taskId:run.steps.get(operation)});
      if (run.reserved+cost>115) return send(res,429,{error:"This run has reached the 115-credit cap."});
      // Reserve the known Tripo credit amount before making a billable call.
      run.reserved+=cost; run.steps.set(operation,"pending");
      try {
        const task=await createTask(operation,body);
        run.steps.set(operation,task.task_id);
        return send(res,202,{taskId:task.task_id,status:"queued",reservedCredits:run.reserved,creditCap:115});
      } catch(e) { run.reserved-=cost; run.steps.delete(operation); throw e; }
    }
    if (req.method==="GET") {
      const taskId=taskIdFrom(req);
      if(!taskId)return send(res,400,{error:"A valid taskId is required."});
      const task=await tripo("/task/"+taskId);
      if(req.query?.download==="1") {
        if(task.status!=="success")return send(res,409,{error:"Model is not ready yet."});
        const modelUrl=task.output?.pbr_model||task.output?.model;
        if(!modelUrl)return send(res,502,{error:"Tripo completed without a downloadable model."});
        const file=await fetch(modelUrl);if(!file.ok)return send(res,502,{error:"Could not download the generated model."});
        const bytes=Buffer.from(await file.arrayBuffer());res.status(200);
        res.setHeader("Content-Type","model/gltf-binary");
        res.setHeader("Content-Disposition",`inline; filename="${req.query?.asset==="character"?"fuzzy-elf-walk":"fuzzy-north-pole-island"}.glb"`);
        res.setHeader("Cache-Control","private, no-store");return res.end(bytes);
      }
      return send(res,200,{taskId:task.task_id,status:task.status,progress:task.progress||0,consumedCredits:task.consumed_credit??null,error:task.status==="failed"?"Tripo could not complete this generation.":undefined});
    }
    res.setHeader("Allow","GET, POST");return send(res,405,{error:"Method not allowed."});
  } catch(error) {
    console.error("Tripo API error:",error.message);
    return send(res,error.status&&error.status<500?error.status:502,{error:error.status===401?"Tripo rejected the API key. Check TRIPO_API_KEY.":"Tripo request failed. Please try again."});
  }
};
module.exports.config={api:{bodyParser:false}};
