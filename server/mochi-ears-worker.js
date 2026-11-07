/* Mochi Ears – Cloudflare Worker trung gian gửi bản ghi giọng bé sang Azure Pronunciation Assessment.
   Khoá Azure chỉ nằm trong biến bí mật của Worker (KEY), không bao giờ xuất hiện trong app.
   Biến cần đặt trong Worker → Settings → Variables and Secrets:
     KEY     (Secret) : Key 1 của tài nguyên Azure Speech
     REGION  (Text)   : vùng của tài nguyên, ví dụ southeastasia
     ALLOWED (Text)   : trang được phép gọi, ví dụ https://quayloo.github.io  (nhiều trang thì cách nhau bằng dấu phẩy) */
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED || 'https://quayloo.github.io').split(',').map(s => s.trim()).filter(Boolean);
    const ok = allowed.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': ok ? origin : allowed[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!ok) return new Response('forbidden', { status: 403, headers: cors });
    const url = new URL(req.url);
    if (url.pathname !== '/assess' || req.method !== 'POST') return new Response('not found', { status: 404, headers: cors });
    if (!env.KEY || !env.REGION) return new Response('{"error":"missing KEY/REGION"}', { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
    const ref = (url.searchParams.get('text') || '').slice(0, 300);
    const lang = /^en-(US|GB|AU)$/.test(url.searchParams.get('lang') || '') ? url.searchParams.get('lang') : 'en-US';
    const body = await req.arrayBuffer();
    if (!body.byteLength || body.byteLength > 1500000) return new Response('{"error":"bad audio size"}', { status: 413, headers: { ...cors, 'Content-Type': 'application/json' } });
    const cfg = { ReferenceText: ref, GradingSystem: 'HundredMark', Granularity: 'Phoneme', Dimension: 'Comprehensive', EnableMiscue: true };
    const pa = btoa(unescape(encodeURIComponent(JSON.stringify(cfg))));
    const r = await fetch(`https://${env.REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${lang}&format=detailed`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': env.KEY, 'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000', 'Pronunciation-Assessment': pa, 'Accept': 'application/json' },
      body
    });
    return new Response(await r.text(), { status: r.status, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
};
