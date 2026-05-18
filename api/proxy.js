/**
 * 小贝AI API 代理 - Vercel Edge Function (最简测试版)
 * 先验证 Edge Function 能否正常运行
 */
export const runtime = 'edge';

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === '/health' || path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: '小贝AI API 代理 (Edge)',
      version: '3.0.0-minimal-test',
      runtime: 'edge',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  return new Response(JSON.stringify({
    error: 'Not Found'
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
