// 新增 AI 模型调用工具类函数，封装对 API 的 fetch 调用，支持流式返回
export async function callAiModel({ apiUrl, apiKey, model, messages, temperature = 0.7, maxTokens = 4096, signal, onChunk }) {
  const requestBody = {
    model,
    messages,
    stream: true,
    temperature,
    max_tokens: maxTokens
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
  }

  const newMessage = {
    role: 'assistant',
    content: '',
    reasoning_content: '',
    timestamp: new Date().toISOString()
  };

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line === 'data: [DONE]') break;
      try {
        const jsonStr = line.replace('data: ', '');
        if (!jsonStr.trim()) continue;
        const data = JSON.parse(jsonStr);
        if (data.choices[0]?.delta?.reasoning_content !== undefined) {
          newMessage.reasoning_content += data.choices[0].delta.reasoning_content || '';
        }
        if (data.choices[0]?.delta?.content !== undefined) {
          newMessage.content += data.choices[0].delta.content || '';
        }
        // 每次收到数据调用回调更新 UI
        if (typeof onChunk === 'function') {
          onChunk(newMessage);
        }
      } catch (error) {
        console.error('数据解析错误:', error, '原始数据:', line);
      }
    }
  }
  return newMessage;
} 