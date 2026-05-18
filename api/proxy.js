/**
 * 小贝AI API 代理 - Vercel Serverless Function (CommonJS)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const UPSTREAM_BASE = 'https://api.siliconflow.cn';
const UPSTREAM_KEY  = process.env.SILICONFLOW_API_KEY || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
  'Access-Control-Max-Age':       '86400',
};

function sendJson(res, data, status) {
  const body = JSON.stringify(data);
  res.writeHead(status || 200, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    ...CORS_HEADERS
  });
  res.end(body);
}

module.exports = async function handler(req, res) {
  const urlObj = new URL(req.url, 'https://xiaobei.xn--fiqs8s');
  const path = urlObj.pathname;

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  // 健康检查
  if (path === '/health' || path === '/api/health') {
    return sendJson(res, { status: 'ok', service: '小贝AI API 代理', version: '1.0.0', key_set: !!UPSTREAM_KEY });
  }

  // 只转发 /v1/* 请求
  if (!path.startsWith('/v1/')) {
    return sendJson(res, { error: 'Not Found', message: '请使用 /v1/ 前缀访问 API' }, 404);
  }

  // 验证用户 Key
  const auth = req.headers['authorization'] || '';
  const userKey = auth.replace(/^Bearer\s+/i, '').trim();
  if (!userKey.startsWith('sk-xiaobei-')) {
    return sendJson(res, {
      error: { message: '无效的 API Key，请购买后获取以 sk-xiaobei- 开头的密钥', type: 'invalid_request_error' }
    }, 401);
  }

  // 检查上游 Key
  if (!UPSTREAM_KEY) {
    return sendJson(res, {
      error: { message: '服务配置错误：上游 API Key 未配置，请联系管理员', type: 'server_error' }
    }, 500);
  }

  // 读取请求体
  let bodyChunks = [];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    await new Promise((resolve) => {
      req.on('data', chunk => bodyChunks.push(chunk));
      req.on('end', resolve);
      req.on('error', resolve);
    });
  }
  const bodyBuffer = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : null;

  // 构建上游请求头
  const upstreamHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    const lk = k.toLowerCase();
    if (lk === 'host' || lk === 'authorization' || lk === 'connection') continue;
    upstreamHeaders[k] = v;
  }
  upstreamHeaders['Authorization'] = 'Bearer ' + UPSTREAM_KEY;
  if (bodyBuffer && !upstreamHeaders['Content-Type']) {
    upstreamHeaders['Content-Type'] = 'application/json';
  }
  if (bodyBuffer) {
    upstreamHeaders['Content-Length'] = bodyBuffer.length;
  }

  // 发送到上游
  const upstreamUrl = new URL(UPSTREAM_BASE + path + urlObj.search);
  const protocol = upstreamUrl.protocol === 'https:' ? https : http;
  const options = {
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (upstreamUrl.protocol === 'https:' ? 443 : 80),
    path: upstreamUrl.pathname + upstreamUrl.search,
    method: req.method,
    headers: upstreamHeaders,
    timeout: 30000
  };

  await new Promise((resolve, reject) => {
    const proxyReq = protocol.request(options, (proxyRes) => {
      // 设置响应头
      const responseHeaders = { ...CORS_HEADERS };
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        const lk = k.toLowerCase();
        if (lk.startsWith('access-control-')) continue;
        responseHeaders[k] = v;
      }
      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
      proxyRes.on('error', reject);
    });

    proxyReq.on('error', (err) => {
      if (!res.headersSent) {
        sendJson(res, {
          error: { message: '上游服务连接失败：' + err.message, type: 'server_error' }
        }, 502);
      }
      resolve();
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        sendJson(res, {
          error: { message: '上游服务响应超时', type: 'server_error' }
        }, 504);
      }
      resolve();
    });

    if (bodyBuffer) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  });
};
