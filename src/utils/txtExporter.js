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
 *    preserveLists {Boolean} 是否保留列表格式，默认 true
 * @returns {String} 拼接好的文本内容
 */

// Helper function：去除Markdown格式
function removeMarkdown(text, options = {}) {
  const {
    stripHeadings = true,
    stripBold = true,
    stripItalic = true,
    stripLinks = true,
    stripImages = true,
    stripCodeBlocks = true,
    stripInlineCode = true,
    stripBlockquotes = true,
    stripHorizontalRules = true,
    stripStrikethrough = true,
    preserveLists = true
  } = options;

  let result = text;

  // 移除标题
  if (stripHeadings) {
    result = result.replace(/^#{1,6}\s+/gm, '');
  }

  // 移除加粗
  if (stripBold) {
    result = result.replace(/\*\*(.*?)\*\*/g, '$1');
    result = result.replace(/__(.*?)__/g, '$1');
  }

  // 移除斜体
  if (stripItalic) {
    // 用反向引用避免嵌套问题
    result = result.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '$1');
    result = result.replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, '$1');
  }

  // 移除链接，保留链接文本
  if (stripLinks) {
    result = result.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
  }

  // 移除图片，可选保留alt文本
  if (stripImages) {
    result = result.replace(/!\[(.*?)\]\((.*?)\)/g, '[图片：$1]');
  }

  // 移除代码块
  if (stripCodeBlocks) {
    result = result.replace(/```[\s\S]*?```/g, (match) => {
      return match.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '$1');
    });
  }

  // 移除行内代码
  if (stripInlineCode) {
    result = result.replace(/`([^`]+)`/g, '$1');
  }

  // 移除引用
  if (stripBlockquotes) {
    result = result.replace(/^>\s+/gm, '');
  }

  // 移除水平分割线
  if (stripHorizontalRules) {
    result = result.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  }

  // 移除删除线
  if (stripStrikethrough) {
    result = result.replace(/~~(.*?)~~/g, '$1');
  }

  // 如果不保留列表，则移除列表标记
  if (!preserveLists) {
    // 移除无序列表标记
    result = result.replace(/^[\s]*[-*+][\s]+/gm, '');
    // 移除有序列表标记
    result = result.replace(/^[\s]*\d+\.[\s]+/gm, '');
  }

  return result;
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
    preserveLists = true,
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
    const content = stripMarkdown 
      ? removeMarkdown(msg.content, { preserveLists }) 
      : msg.content;
      
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