/**
 * 小贝AI API 代理 - Vercel Serverless Function
 * 路由：/api/proxy（匹配 /v1/* 请求）
 *
 * 功能：
 *  1. 验证用户 API Key（sk-xiaobei-xxx）
 *  2. 将请求转发给硅基流动
 *  3. 支持流式（stream）和普通响应
 *  4. 统一 CORS 头，支持浏览器直调
 *
 * 环境变量（Vercel Dashboard 配置）：
 *  SILICONFLOW_API_KEY  - 硅基流动 API Key（上游）
 *  ADMIN_SECRET         - 管理员密钥（后台操作用）
 *
 * 部署后访问：
 *  https://xiaobei-api.vercel.app/v1/chat/completions
 */

const UPSTREAM_BASE = 'https://api.siliconflow.cn';
const UPSTREAM_KEY  = process.env.SILICONFLOW_API_KEY || '';

// ====== CORS 头 ======
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-requested-with',
  'Access-Control-Max-Age':       '86400',
};

// ====== 简单内存用户表（临时方案，正式上线换数据库） ======
// key: sk-xiaobei-xxx  value: { quota_tokens: 剩余额度(单位:千token) }
const USERS = {};

// ====== 工具函数 ======
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

function extractToken(req) {
  const auth = req.headers.get('Authorization') || '';
  return auth.replace(/^Bearer\s+/i, '').trim();
}

// ====== 主处理函数 ======
export default async function handler(req) {
  const url   = new URL(req.url);
  const path  = url.pathname; // e.g. /v1/chat/completions

  // OPTIONS 预检
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // ====== 健康检查 ======
  if (path === '/health' || path === '/api/health') {
    return jsonResponse({ status: 'ok', service: '小贝AI API 代理', version: '1.0.0' });
  }

  // ====== 只转发 /v1/* 请求 ======
  if (!path.startsWith('/v1/')) {
    return jsonResponse({ error: 'Not Found', message: '请使用 /v1/ 前缀访问 API' }, 404);
  }

  // ====== 验证用户 Key ======
  const userKey = extractToken(req);
  if (!userKey.startsWith('sk-xiaobei-')) {
    return jsonResponse({
      error: { message: '无效的 API Key，请购买后获取以 sk-xiaobei- 开头的密钥', type: 'invalid_request_error' }
    }, 401);
  }

  // 检查 Key 是否存在（已发放）
  if (!(userKey in USERS)) {
    // 开发阶段：未在 USERS 表内的 key 仍然放行（方便测试）
    // 上线后改为：return jsonResponse({ error: { message: 'API Key 不存在或已过期' } }, 403);
    USERS[userKey] = { quota_tokens: 999999 }; // 临时注册
  }

  const user = USERS[userKey];
  if (user.quota_tokens <= 0) {
    return jsonResponse({
      error: { message: '账户额度已用尽，请登录充值', type: 'insufficient_quota' }
    }, 429);
  }

  // ====== 构建上游请求 ======
  if (!UPSTREAM_KEY) {
    return jsonResponse({
      error: { message: '服务配置错误：上游 API Key 未配置，请联系管理员', type: 'server_error' }
    }, 500);
  }

  const upstreamUrl = `${UPSTREAM_BASE}${path}${url.search}`;

  // 读取请求体
  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch (_) {
      body = null;
    }
  }

  // 透传请求头，替换 Authorization
  const upstreamHeaders = new Headers();
  for (const [k, v] of req.headers.entries()) {
    if (k.toLowerCase() === 'authorization') continue;
    if (k.toLowerCase() === 'host') continue;
    upstreamHeaders.set(k, v);
  }
  upstreamHeaders.set('Authorization', `Bearer ${UPSTREAM_KEY}`);
  if (!upstreamHeaders.has('Content-Type') && body) {
    upstreamHeaders.set('Content-Type', 'application/json');
  }

  // ====== 发送到上游 ======
  let upstreamRes;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method:  req.method,
      headers: upstreamHeaders,
      body:    body || undefined,
    });
  } catch (err) {
    return jsonResponse({
      error: { message: `上游服务连接失败：${err.message}`, type: 'server_error' }
    }, 502);
  }

  // ====== 透传响应 ======
  const resHeaders = new Headers(CORS_HEADERS);
  for (const [k, v] of upstreamRes.headers.entries()) {
    // 避免重复 CORS 头
    if (k.toLowerCase().startsWith('access-control-')) continue;
    resHeaders.set(k, v);
  }

  // 流式响应直接管道
  if (upstreamRes.headers.get('content-type')?.includes('text/event-stream')) {
    return new Response(upstreamRes.body, {
      status:  upstreamRes.status,
      headers: resHeaders,
    });
  }

  // 普通响应
  const resBody = await upstreamRes.text();
  return new Response(resBody, {
    status:  upstreamRes.status,
    headers: resHeaders,
  });
}
