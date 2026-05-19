const UPSTREAM_BASE = 'https://api.siliconflow.cn';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();
  const KEY = process.env.SILICONFLOW_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'API Key not configured' });
  const seg = req.query.path;
  const sub = Array.isArray(seg) ? seg.join('/') : (seg || 'models');
  const url = `${UPSTREAM_BASE}/v1/${sub}`;
  let body;
  if (req.method !== 'GET' && req.body) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }
  try {
    const r = await fetch(url, {
      method: req.method,
      headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': req.headers['content-type'] || 'application/json' },
      body,
    });
    res.status(r.status).setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.send(await r.text());
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
