// 该工具模块用于显示剧本预览并确认是否使用剧本，同时内置通配符处理功能
import { ElMessageBox } from 'element-plus';
import { createApp } from 'vue';
import MarkdownIt from 'markdown-it';
import PromptWildcards from '../components/PromptWildcards.vue';

// 初始化 markdown-it
const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true
});

// 通配符正则（支持中英文括号和标点）
const wildcardRegex = /\{\{\s*[\(（]提示[:：](.*?)[\)）]\s*[，,]\s*[\(（]选项[:：](.*?)[\)）]\s*[，,]\s*[\(（]写入[:：](.*?)[\)）]\s*\}\}/g;

/**
 * 提取文本中所有的通配符信息
 * @param {string} text - 剧本文本
 * @returns {Array} 数组，每个对象包含：
 *    fullMatch: 完整匹配的文本
 *    prompt: 提示文本
 *    options: 可选项数组（用逗号、顿号等分隔）
 *    defaultValue: 默认值（第一个选项）
 *    template: 写入模板（含"X"占位符）
 *    index: 顺序索引
 */
function extractWildcards(text) {
  const wildcards = [];
  let match;
  let index = 0;
  wildcardRegex.lastIndex = 0; // 重置正则状态
  while ((match = wildcardRegex.exec(text)) !== null) {
    const [fullMatch, prompt, optionsStr, template] = match;
    const options = optionsStr
      .split('、')  // 只用顿号分隔
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    wildcards.push({
      fullMatch,
      prompt: prompt.trim(),
      options,
      defaultValue: options.length > 0 ? options[0] : '',
      template: template.trim(),
      index
    });
    index++;
  }
  return wildcards;
}

/**
 * 根据玩家填写的内容替换通配符
 * @param {string} text - 原始剧本文本
 * @param {Object} selections - 玩家填写的映射（键为索引，值为选中内容）
 * @returns {string} 替换后的文本
 */
function fillWildcards(text, selections = {}) {
  let counter = 0;
  wildcardRegex.lastIndex = 0; // 重置正则状态
  return text.replace(wildcardRegex, (match, prompt, optionsStr, template) => {
    const options = optionsStr
      .split('、')  // 只用顿号分隔
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    const defaultValue = options.length > 0 ? options[0] : '';
    const chosenValue =
      Object.prototype.hasOwnProperty.call(selections, counter)
        ? selections[counter]
        : defaultValue;
    const filledText = template.replace(/X/gi, chosenValue);
    counter++;
    return filledText;
  });
}

/**
 * 修改后的对话框提示函数：一次性显示所有通配符让玩家同时填写
 * @param {Array} wildcards - 通配符数组（由 extractWildcards 得到）
 * @returns {Promise<Object>} 返回映射对象：键为通配符索引，值为玩家填写的内容
 */
function promptWildcards(wildcards) {
  return new Promise((resolve, reject) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const app = createApp(PromptWildcards, {
      wildcards,
      onConfirm: (selections) => {
        resolve(selections);
        app.unmount();
        document.body.removeChild(container);
      },
      onCancel: () => {
        reject(new Error('取消输入'));
        app.unmount();
        document.body.removeChild(container);
      }
    });
    app.mount(container);
  });
}

// 修改 dialogConfig 对象
const dialogConfig = {
  width: '80%',
  customStyle: {
    maxWidth: '701px',
    margin: '5vh auto 0',
    '.el-message-box__content': {
      maxHeight: '80vh',
      overflow: 'auto',
      padding: '20px 24px'
    },
    '.el-message-box__content::-webkit-scrollbar': {
      width: '8px'
    },
    '.el-message-box__content::-webkit-scrollbar-track': {
      backgroundColor: 'transparent'
    },
    '.el-message-box__content::-webkit-scrollbar-thumb': {
      backgroundColor: 'var(--el-border-color)',
      borderRadius: '4px'
    },
    '.el-message-box__content::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'var(--el-border-color-darker)'
    },
    '.el-message-box__header': {
      padding: '16px 24px',
      borderBottom: '1px solid var(--el-border-color-light)',
      position: 'sticky',
      top: 0,
      backgroundColor: 'white',
      zIndex: 1
    },
    '.el-message-box__footer': {
      padding: '16px 24px',
      borderTop: '1px solid var(--el-border-color-light)',
      position: 'sticky',
      bottom: 0,
      backgroundColor: 'white',
      zIndex: 1
    }
  }
};

/**
 * 修改 showConfirm 函数
 * @param {string} preview - 最终预览文本
 * @param {Object} script - 剧本对象，用于构造标题
 * @param {Object} options - 额外选项
 * @returns {Promise} 返回 ElMessageBox.confirm 的 Promise
 */
function showConfirm(preview, script, options = {}) {
  const defaultTitle = script.title ? `剧本预览 - ${script.title}` : '剧本预览';
  const defaultOptions = {
    title: defaultTitle,
    confirmButtonText: '使用该剧本',
    cancelButtonText: '取消',
    customClass: 'global-dialog script-preview-dialog',
    dangerouslyUseHTMLString: true,
    showClose: true,
    ...dialogConfig
  };
  const finalOptions = { ...defaultOptions, ...options };
  return ElMessageBox.confirm(preview, finalOptions.title, finalOptions);
}

/**
 * 修改预览样式
 * @returns {string} 预览样式
 */
const previewStyles = `
  <style>
    .script-preview-content {
      font-size: 15px;
      line-height: 1.6;
      color: var(--el-text-color-primary);
    }
    .preview-notice {
      margin-bottom: 20px;
      padding: 12px 16px;
      background: var(--el-color-warning-light-9);
      border-radius: 8px;
      color: var(--el-color-warning);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .markdown-body {
      padding: 0 4px;
    }
    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3 {
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: 0.3em;
      margin-top: 1.5em;
      margin-bottom: 1em;
    }
    .markdown-body pre {
      background-color: var(--el-fill-color-light);
      border-radius: 8px;
      padding: 16px;
      overflow: auto;
    }
    .markdown-body code {
      background-color: var(--el-fill-color);
      border-radius: 4px;
      padding: 0.2em 0.4em;
      font-size: 85%;
    }
    .markdown-body blockquote {
      border-left: 4px solid var(--el-border-color);
      color: var(--el-text-color-secondary);
      margin: 0;
      padding: 0 1em;
    }
    .wildcard-placeholder {
      display: inline-block;
      background-color: var(--el-color-primary-light-9);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px dashed var(--el-color-primary);
      color: var(--el-color-primary);
      font-weight: 500;
      cursor: help;
    }
    .preview-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
    .preview-footer a {
      color: var(--el-color-primary);
      text-decoration: none;
    }
    .preview-footer a:hover {
      text-decoration: underline;
    }
    .preview-footer .tags-info {
      margin-top: 8px;
    }
  </style>
`;

/**
 * 主函数：确认并使用剧本
 * 如果剧本文本中包含通配符（符合格式{{(提示：...)}}），则依次提示用户填写，
 * 替换后再显示确认对话框；如果没有通配符，则只显示一次确认对话框。
 *
 * @param {Object} script - 剧本对象，必须包含 content 字段
 * @param {Object} options - 额外选项
 * @returns {Promise} 返回最终的 ElMessageBox.confirm Promise
 */
function confirmUseScript(script, options = {}) {
  const rawContent = script.content || '';
  const wildcards = extractWildcards(rawContent);

  // 构建初始预览HTML
  let previewContent = rawContent.replace(wildcardRegex, (match, prompt, optionsStr, template) => {
    return `<span class="wildcard-placeholder">${prompt.trim()}</span>`;
  });

  // 转换 Markdown 为 HTML
  let previewHtml = `
    <div class="script-preview-content">
      ${wildcards.length > 0 ? `
        <div class="preview-notice">
          <i class="el-icon-info"></i>
          这个剧本包含 ${wildcards.length} 处需要填写的内容，确认后将进入填写界面
        </div>
      ` : ''}
      <div class="markdown-body">
        ${md.render(previewContent)}
      </div>
      ${script.authorLink || (script.tags && script.tags.length) ? `
        <div class="preview-footer">
          ${script.authorLink ? `
            <div class="author-info">
              ${script.authorName ? 
                `作者：<a href="${script.authorLink}" target="_blank">${script.authorName}</a>` :
                `<a href="${script.authorLink}" target="_blank">作者链接</a>`
              }
            </div>
          ` : ''}
          ${script.tags && script.tags.length ? `
            <div class="tags-info">
              标签：${script.tags.join(', ')}
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;

  // 添加预览样式
  previewHtml = previewStyles + previewHtml;

  // 显示预览对话框
  return showConfirm(previewHtml, script, {
    title: script.title ? `剧本预览 - ${script.title}` : '剧本预览',
    confirmButtonText: wildcards.length > 0 ? '下一步' : '使用该剧本',
    cancelButtonText: '取消',
    customClass: 'preview-dialog-initial',
    showClose: true,
    width: '80%',
    customStyle: {
      maxWidth: '701px',
      margin: '5vh auto 0',
      '.el-message-box__content': {
        maxHeight: '80vh',
        overflow: 'auto'
      }
    }
  }).then(() => {
    if (wildcards.length === 0) {
      return rawContent;
    }

    // 有通配符时，显示填写界面
    return promptWildcards(wildcards)
      .then(selections => {
        const finalContent = fillWildcards(rawContent, selections);
        
        // 显示最终预览（同样使用 Markdown 渲染）
        let finalPreview = `
          <div class="script-preview-content">
            <div class="markdown-body">
              ${md.render(finalContent)}
            </div>
            ${script.authorLink || (script.tags && script.tags.length) ? `
              <div class="preview-footer">
                ${script.authorLink ? `
                  <div class="author-info">
                    ${script.authorName ? 
                      `作者：<a href="${script.authorLink}" target="_blank">${script.authorName}</a>` :
                      `<a href="${script.authorLink}" target="_blank">作者链接</a>`
                    }
                  </div>
                ` : ''}
                ${script.tags && script.tags.length ? `
                  <div class="tags-info">
                    标签：${script.tags.join(', ')}
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        `;

        // 显示最终确认对话框
        return showConfirm(finalPreview, script, {
          title: '确认使用该剧本',
          confirmButtonText: '确定使用',
          cancelButtonText: '返回修改',
          customClass: 'preview-dialog-final',
          showClose: true,
          width: '80%',
          customStyle: {
            maxWidth: '701px',
            margin: '5vh auto 0',
            '.el-message-box__content': {
              maxHeight: '80vh',
              overflow: 'auto'
            }
          }
        }).then(() => finalContent);
      });
  });
}

export default confirmUseScript; 