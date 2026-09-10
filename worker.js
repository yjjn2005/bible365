// bible365-api : PIN 기반 진행률 동기화 Cloudflare Worker
// KV 바인딩 이름: BIBLE365_SYNC

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/sync") {
      return jsonResponse({ error: "not found" }, 404);
    }

    if (request.method === "GET") {
      const pin = url.searchParams.get("pin");
      if (!pin) return jsonResponse({ error: "pin required" }, 400);
      const key = "bible365:" + (await sha256Hex(pin));
      const stored = await env.BIBLE365_SYNC.get(key);
      if (!stored) return jsonResponse({ found: false });
      return jsonResponse({ found: true, data: JSON.parse(stored) });
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: "invalid json" }, 400);
      }
      const { pin, data } = body || {};
      if (!pin || !data) return jsonResponse({ error: "pin and data required" }, 400);
      const key = "bible365:" + (await sha256Hex(pin));
      await env.BIBLE365_SYNC.put(key, JSON.stringify(data));
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ error: "method not allowed" }, 405);
  },
};
