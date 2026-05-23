/**
 * Cloudflare Pages Function — 代理百炼 API 请求
 * 在 Cloudflare Pages 设置中添加环境变量 DASHSCOPE_API_KEY
 */
export async function onRequest(context) {
  const { request, env } = context;

  // 只允许 POST
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return new Response('服务端未配置 API Key', { status: 500 });
  }

  try {
    const body = await request.json();

    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return new Response(errText, { status: response.status });
    }

    // 流式转发
    const { readable, writable } = new TransformStream();
    response.body.pipeTo(writable);

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(err.message || '代理请求失败', { status: 500 });
  }
}
