export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.query.path || [];
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `https://api.siliconflow.cn/v1/${pathStr}`;

  try {
    const resp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' && req.body ? JSON.stringify(req.body) : undefined,
    });

    const contentType = resp.headers.get('content-type') || '';
    res.status(resp.status);
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('application/json')) {
      const data = await resp.json();
      return res.json(data);
    } else {
      const text = await resp.text();
      return res.send(text);
    }
  } catch (e) {
    return res.status(500).json({ error: 'Proxy error', message: e.message });
  }
}
