import html2pdf from 'html2pdf.js';

/**
 * 辅助方法：从元素中提取纯文本（用于将 Markdown 渲染后的 HTML 转换为文本）
 */
function extractTextFromMarkdown(element) {
  let text = '';
  const nodes = element.childNodes;
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      switch (node.tagName.toLowerCase()) {
        case 'p':
          text += extractTextFromMarkdown(node);
          break;
        case 'br':
          text += ' ';
          break;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          text += extractTextFromMarkdown(node).toUpperCase();
          break;
        case 'ul':
        case 'ol':
          text += extractTextFromMarkdown(node);
          break;
        case 'li':
          text += '• ' + extractTextFromMarkdown(node);
          break;
        case 'code':
        case 'pre':
          text += extractTextFromMarkdown(node);
          break;
        default:
          text += extractTextFromMarkdown(node);
      }
    }
  }
  return text.trim();
}

/**
 * 导出当前对话为 PDF
 * @param {Object} chat - 聊天记录对象，包含 title、createdAt 与 messages
 * @param {Function} renderMarkdownFn - 用于将 Markdown 转换为 HTML 的函数
 */
export async function exportChatToPDF(chat, renderMarkdownFn) {
  // 创建临时容器作为 PDF 内容
  const tempDiv = document.createElement('div');
  tempDiv.className = 'export-content';

  // 插入对话标题与创建时间
  const title = chat.title || '聊天记录';
  const creationTime = new Date(chat.createdAt).toLocaleString('zh-CN');
  tempDiv.innerHTML = `
    <h1 class="mb-2">${title}</h1>
    <div class="mb-5 text-customGray">
      创建时间：${creationTime}
    </div>
  `;

  // 遍历所有消息，构建消息内容区域
  chat.messages.forEach(msg => {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('my-4', 'p-4', 'border', 'border-gray-200', 'page-break-avoid');

    const headerDiv = document.createElement('div');
    headerDiv.classList.add('mb-2', 'flex', 'justify-between');

    const roleSpan = document.createElement('span');
    roleSpan.classList.add('font-bold');
    // 如果需要更动态的助手名称，可以调整这里
    roleSpan.textContent = msg.role === 'user' ? '用户' : '助手';
    headerDiv.appendChild(roleSpan);

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('text-gray-600', 'text-xs');
    timeSpan.textContent = new Date(msg.timestamp).toLocaleString('zh-CN');
    headerDiv.appendChild(timeSpan);

    messageDiv.appendChild(headerDiv);

    // 如果是助手消息并且存在思考过程，则插入
    if (msg.role === 'assistant' && msg.reasoning_content) {
      const reasoningDiv = document.createElement('div');
      reasoningDiv.classList.add('my-2', 'p-2', 'bg-reasoningBg', 'text-white');

      const reasoningLabel = document.createElement('div');
      reasoningLabel.classList.add('font-bold', 'mb-1');
      reasoningLabel.textContent = '思考过程：';
      reasoningDiv.appendChild(reasoningLabel);

      const reasoningContent = document.createElement('div');
      reasoningContent.classList.add('whitespace-pre-wrap');
      reasoningContent.textContent = msg.reasoning_content;
      reasoningDiv.appendChild(reasoningContent);

      messageDiv.appendChild(reasoningDiv);
    }

    // 消息内容处理
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('whitespace-pre-wrap');
    if (msg.role === 'assistant') {
      // 对于助手的消息，先使用传入的 renderMarkdownFn 转换为 HTML，
      // 然后调用 extractTextFromMarkdown 提取纯文本用于 PDF 导出
      const tempElement = document.createElement('div');
      tempElement.innerHTML = renderMarkdownFn(msg.content);
      contentDiv.textContent = extractTextFromMarkdown(tempElement);
    } else {
      contentDiv.textContent = msg.content;
    }
    messageDiv.appendChild(contentDiv);
    tempDiv.appendChild(messageDiv);
  });

  // 配置 html2pdf 选项
  const opt = {
    margin: [15, 15],
    filename: `${chat.title || '聊天记录'}.pdf`,
    pagebreak: { mode: 'avoid-all' },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  document.body.appendChild(tempDiv);
  try {
    await html2pdf().set(opt).from(tempDiv).save();
  } finally {
    document.body.removeChild(tempDiv);
  }
} 