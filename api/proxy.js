/**
 * 小贝AI API 代理 - Vercel Edge Function
 * 使用 Edge Runtime，避免 Serverless 的 http/https 模块不稳定问题
 */
export const runtime = 'edge';

const UPSTREAM_BASE = 'https://api.siliconflow.cn';
const UPSTREAM_KEY  = process.env.SILICONFLOW_API_KEY || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
};

function json(status, data, init = {}) {
  const headers = new Headers(init.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => headers.set(k, v));
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(data), { status, headers });
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: new Headers(CORS_HEADERS) });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  if (path === '/health' || path === '/api/health') {
    return json(200, {
      status: 'ok',
      service: '小贝AI API 代理 (Edge)',
      version: '2.0.0',
      runtime: 'edge',
      key_set: !!UPSTREAM_KEY
    });
  }

  if (!path.startsWith('/v1/')) {
    return json(404, {
      error: { message: 'Not Found，请使用 /v1/ 前缀访问 API', type: 'invalid_request_error' }
    });
  }

  const auth = req.headers.get('authorization') || '';
  const userKey = auth.replace(/^Bearer\s+/i, '').trim();
  if (!userKey.startsWith('sk-xiaobei-')) {
    return json(401, {
      error: { message: '无效的 API Key，请购买后获取以 sk-xiaobei- 开头的密钥', type: 'invalid_request_error' }
    });
  }

  if (!UPSTREAM_KEY) {
    return json(500, {
      error: { message: '服务配置错误：上游 API Key 未配置，请联系管理员', type: 'server_error' }
    });
  }

  const upstreamUrl = UPSTREAM_BASE + path + url.search;
  const upstreamHeaders = new Headers();
  req.headers.forEach((value, key) => {
    const lk = key.toLowerCase();
    if (lk === 'host' || lk === 'connection') return;
    upstreamHeaders.set(key, value);
  });
  upstreamHeaders.set('Authorization', 'Bearer ' + UPSTREAM_KEY);

  const upstreamInit = { method: req.method, headers: upstreamHeaders };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const body = await req.json();
        upstreamInit.body = JSON.stringify(body);
        upstreamHeaders.set('Content-Type', 'application/json');
      } catch {
        upstreamInit.body = await req.text();
      }
    } else {
      upstreamInit.body = await req.text();
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  upstreamInit.signal = controller.signal;

  try {
    const upstreamRes = await fetch(upstreamUrl, upstreamInit);
    clearTimeout(timer);

    const responseHeaders = new Headers(CORS_HEADERS);
    upstreamRes.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('Content-Type', 'application/json; charset=utf-8');

    return new Response(await upstreamRes.text(), { status: upstreamRes.status, headers: responseHeaders });

  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return json(504, { error: { message: '上游服务响应超时（>30秒）', type: 'server_error' } });
    }
    return json(502, { error: { message: '上游服务连接失败：' + err.message, type: 'server_error' } });
  }
}
