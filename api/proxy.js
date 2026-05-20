// 小贝AI API代理服务 - SiliconFlow
// Vercel Edge Functions 版本
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: '仅支持POST请求，请使用POST方法' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: '请求体格式错误，请发送JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { model, messages, temperature, max_tokens } = body;
    console.log('Received request:', { model, hasMessages: !!messages });

    const apiKey = process.env.SILICONFLOW_API_KEY;
    console.log('API Key configured:', !!apiKey);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: '服务器未配置API Key，请在Vercel环境变量中设置SILICONFLOW_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'deepseek-ai/DeepSeek-V3',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 2048,
      }),
    });

    const data = await response.json();
    console.log('SiliconFlow response:', JSON.stringify(data).substring(0, 200));

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'API调用失败', details: data }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(JSON.stringify({ error: err.message || '服务器内部错误', stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
