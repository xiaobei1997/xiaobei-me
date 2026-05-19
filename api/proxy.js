/**
 * 小贝AI API 代理 - Vercel Serverless Function
 * 路由：/api/proxy → 匹配 /v1/* 路由规则来自 vercel.json
 *
 * 环境变量（Vercel Dashboard 配置）：
 *  SILICONFLOW_API_KEY  - 硅基流动 API Key（上游）
 */

const UPSTREAM_BASE = 'https://api.siliconflow.cn';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req, res) {
  // 设置 CORS 头
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 健康检查
  const reqPath = req.url || '';
  if (reqPath === '/health' || reqPath.endsWith('/health')) {
    return res.status(200).json({ status: 'ok', service: '小贝AI API 代理', version: '1.0.0' });
  }

  // 获取上游 Key
  const UPSTREAM_KEY = process.env.SILICONFLOW_API_KEY;
  if (!UPSTREAM_KEY) {
    return res.status(500).json({
      error: { message: '服务配置错误：上游 API Key 未配置，请联系管理员', type: 'server_error' }
    });
  }

  // 从 URL 提取 /v1/... 路径
  // vercel.json rewrites 会把 /v1/:path* 转发到 /api/proxy
  // 但 rewrite 不会传递 path 参数，所以从 req.url 解析
  const targetPath = req.query.path
    ? '/v1/' + (Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path)
    : reqPath.replace(/^\/api\/proxy/, '') || '/v1/models';

  const queryString = Object.entries(req.query)
    .filter(([k]) => k !== 'path')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const upstreamUrl = `${UPSTREAM_BASE}${targetPath}${queryString ? '?' + queryString : ''}`;

  // 读取请求体
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  // 构建上游请求头
  const upstreamHeaders = {
    'Authorization': `Bearer ${UPSTREAM_KEY}`,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };
  // 透传 Accept
  if (req.headers['accept']) {
    upstreamHeaders['Accept'] = req.headers['accept'];
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: upstreamHeaders,
      body: body || undefined,
    });

    const contentType = upstreamRes.headers.get('content-type') || '';
    res.status(upstreamRes.status);
    res.setHeader('Content-Type', contentType);

    // 流式响应
    if (contentType.includes('text/event-stream')) {
      res.setHeader('Transfer-Encoding', 'chunked');
      const reader = upstreamRes.body.getReader();
      const write = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { res.end(); break; }
          res.write(Buffer.from(value));
        }
      };
      return write();
    }

    // 普通响应
    const text = await upstreamRes.text();
    return res.send(text);

  } catch (err) {
    return res.status(502).json({
      error: { message: `上游服务连接失败：${err.message}`, type: 'server_error' }
    });
  }
}
