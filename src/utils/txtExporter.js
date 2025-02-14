/**
 * 导出当前聊天内容为txt小说文本。
 * @param {Object} chat 聊天对象，其中包含 messages 数组。
 * @param {Object} options 配置选项：
 *    includePrefix {Boolean} 是否在每条消息前加说话者，默认 false
 *    prefixUser {String} 用户消息前的说话者，默认 '导演：'
 *    prefixAssistant {String} 助手消息前的说话者，默认 'D老师：'
 *    onlyAssistant {Boolean} 是否只导出助手消息，默认 false
 *    title {String} 小说标题，默认 ''
 *    author {String} 小说作者，默认 ''
 *    dateTime {String} 小说创作时间，默认 ''
 *    stripMarkdown {Boolean} 是否去除Markdown格式，默认 true
 *    description {String} 小说简介，默认 ''
 * @returns {String} 拼接好的文本内容
 */

// Helper function：去除Markdown格式
function removeMarkdown(text) {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/gm, '$1')
    .replace(/\*(.*?)\*/gm, '$1')
    .replace(/__(.*?)__/gm, '$1')
    .replace(/_(.*?)_/gm, '$1')
    .replace(/`([^`]+)`/gm, '$1')
    .replace(/~~(.*?)~~/gm, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/gm, '$1');
}

export async function exportChatToTxtNovel(chat, options = {}) {
  const {
    includePrefix = false,
    prefixUser = '导演：',
    prefixAssistant = 'D老师：',
    onlyAssistant = false,
    title = '',
    author = '',
    description = '',
    dateTime = '',
    stripMarkdown = true,
  } = options;

  let text = '';
  // 添加头部信息
  if (title || author || dateTime || description) {
    if (title) {
      text += "标题：" + title + "\n";
    }
    if (author) {
      text += "作者：" + author + "\n";
    }
    if (dateTime) {
      text += "时间：" + dateTime + "\n";
    }
    text += "\n";
    if (description) {
      text += "简介：" + description + "\n\n\n";
    }
  }

  for (const msg of chat.messages) {
    // 如果只导出助手消息，则跳过用户消息
    if (onlyAssistant && msg.role === 'user') {
      continue;
    }

    // 先处理去掉markdown格式（若启用）
    const content = stripMarkdown ? removeMarkdown(msg.content) : msg.content;
    let line = '';
    if (includePrefix) {
      if (msg.role === 'user') {
        line = prefixUser + "\n" + content;
      } else if (msg.role === 'assistant') {
        line = prefixAssistant + "\n" + content;
      }
    } else {
      line = content;
    }
    // 如果消息为助手，则追加三个换行符（两空行），否则追加两个换行符（一空行）
    if (msg.role === 'assistant') {
      text += line + "\n\n\n";
    } else {
      text += line + "\n\n";
    }
  }
  return text;
} 