const ALLOWED_ORIGIN = process.env.TRIPO_APP_ORIGIN;
const API_BASE = "https://api.tripo3d.ai/v2/openapi";
const requestsByIp = new Map();
const recentStarts = [];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function readImage(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES) {
      const error = new Error("Reference images must be 20 MB or smaller.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 64 * 1024) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON request.");
    error.status = 400;
    throw error;
  }
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
    const error = new Error(data?.message || "Tripo image upload failed.");
    error.status = response.status || 502;
    throw error;
  }
  return data.data.image_token;
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
    const parsed = new URL(origin);
    const requestHost = String(req.headers.host || "").split(":")[0];
    if (ALLOWED_ORIGIN) return parsed.origin === ALLOWED_ORIGIN;
    return parsed.host.split(":")[0] === requestHost;
  } catch {
    return false;
  }
}

async function tripo(path, init = {}) {
  const response = await fetch(API_BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.TRIPO_API_KEY}`,
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    const message = data?.message || data?.detail || "Tripo request failed.";
    const error = new Error(message);
    error.status = response.status || 502;
    throw error;
  }
  return data.data;
}

module.exports = async function handler(req, res) {
  if (!originAllowed(req)) return send(res, 403, { error: "Request origin not allowed." });
  if (!process.env.TRIPO_API_KEY) {
    return send(res, 503, { error: "Tripo is not configured yet. Add TRIPO_API_KEY to the Vercel project environment." });
  }

  try {
    if (req.method === "POST" && req.query?.upload === "1") {
      const contentType = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
      if (!IMAGE_TYPES.has(contentType)) {
        return send(res, 415, { error: "Reference image must be PNG, JPEG, or WebP." });
      }
      const bytes = await readImage(req);
      if (!bytes.length) return send(res, 400, { error: "The reference image is empty." });
      const imageToken = await uploadImage(bytes, contentType);
      return send(res, 200, { imageToken });
    }

    if (req.method === "POST") {
      const body = req.body && typeof req.body === "object" ? req.body : await readJsonBody(req);
      const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
      const imageToken = typeof body.imageToken === "string" ? body.imageToken : "";
      const hasImage = /^[0-9a-f-]{20,40}$/i.test(imageToken);
      if (!hasImage && (prompt.length < 20 || prompt.length > 1024)) {
        return send(res, 400, { error: "Choose a reference image or provide a prompt between 20 and 1024 characters." });
      }

      // Lightweight guard against repeated clicks and accidental credit burn.
      const now = Date.now();
      const ip = String(req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
      const previous = requestsByIp.get(ip) || 0;
      while (recentStarts.length && now - recentStarts[0] > 60 * 60 * 1000) recentStarts.shift();
      if (now - previous < 60 * 60 * 1000 || recentStarts.length >= 1) {
        return send(res, 429, { error: "One generation has already started recently. Please try again later." });
      }
      requestsByIp.set(ip, now);
      recentStarts.push(now);

      const taskPayload = hasImage
        ? {
            type: "image_to_model",
            file: { type: "image", file_token: imageToken },
            model_version: "P1-20260311",
            face_limit: 12000,
            texture: true,
            pbr: true,
          }
        : {
            type: "text_to_model",
            prompt,
            model_version: "P1-20260311",
            face_limit: 12000,
            texture: true,
            pbr: true,
          };
      const task = await tripo("/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskPayload),
      });
      return send(res, 202, { taskId: task.task_id, status: "queued" });
    }

    if (req.method === "GET") {
      const taskId = taskIdFrom(req);
      if (!taskId) return send(res, 400, { error: "A valid taskId is required." });
      const task = await tripo(`/task/${taskId}`);
      if (req.query?.download === "1") {
        if (task.status !== "success") return send(res, 409, { error: "Model is not ready yet." });
        const modelUrl = task.output?.pbr_model || task.output?.model;
        if (!modelUrl) return send(res, 502, { error: "Tripo completed without a downloadable model." });
        const modelResponse = await fetch(modelUrl);
        if (!modelResponse.ok) return send(res, 502, { error: "Could not download the generated model." });
        const bytes = Buffer.from(await modelResponse.arrayBuffer());
        res.status(200);
        res.setHeader("Content-Type", "model/gltf-binary");
        res.setHeader("Content-Disposition", 'inline; filename="wizarding-christmas-island.glb"');
        res.setHeader("Cache-Control", "private, no-store");
        return res.end(bytes);
      }
      return send(res, 200, {
        taskId: task.task_id,
        status: task.status,
        progress: task.progress || 0,
        consumedCredits: task.consumed_credit ?? null,
        error: task.status === "failed" ? "Tripo could not complete this generation. Try a shorter or simpler prompt." : undefined,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return send(res, 405, { error: "Method not allowed." });
  } catch (error) {
    console.error("Tripo API error:", error.message);
    return send(res, error.status && error.status < 500 ? error.status : 502, {
      error: error.status === 401 ? "Tripo rejected the API key. Check TRIPO_API_KEY." : "Tripo generation request failed. Please try again.",
    });
  }
};

module.exports.config = { api: { bodyParser: false } };
