// 该工具模块用于显示剧本预览并确认是否使用剧本，同时内置通配符处理功能
import { ElMessageBox } from 'element-plus';
import { createApp } from 'vue';
import PromptWildcards from '../components/PromptWildcards.vue';

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
      .split(/[,，、]/)
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
      .split(/[,，、]/)
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

/**
 * 显示最终确认对话框
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
    customClass: 'confirm-script-preview',
    dangerouslyUseHTMLString: true,
  };
  const finalOptions = { ...defaultOptions, ...options };
  return ElMessageBox.confirm(preview, finalOptions.title, finalOptions);
}

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

  // 构建初始预览HTML，让通配符更醒目
  let previewHtml = rawContent.replace(wildcardRegex, (match, prompt, optionsStr, template) => {
    return `<span class="wildcard-placeholder" style="background-color: #f0f9ff; padding: 2px 6px; border-radius: 4px; border: 1px dashed #409eff;" title="点击下一步后填写：${prompt.trim()}">${prompt.trim()}</span>`;
  });

  // 添加作者信息和标签
  if (script.authorLink || (script.tags && script.tags.length)) {
    previewHtml += `<hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">`;
    if (script.authorLink) {
      previewHtml += `<div style="color: #666; font-size: 14px;">`;
      if (script.authorName) {
        previewHtml += `作者：<a href="${script.authorLink}" target="_blank" style="color: #409eff;">${script.authorName}</a>`;
      } else {
        previewHtml += `<a href="${script.authorLink}" target="_blank" style="color: #409eff;">作者链接</a>`;
      }
      previewHtml += '</div>';
    }
    if (script.tags && script.tags.length) {
      previewHtml += `<div style="color: #666; font-size: 14px; margin-top: 5px;">标签：${script.tags.join(', ')}</div>`;
    }
  }

  // 添加提示信息
  if (wildcards.length > 0) {
    previewHtml = `
      <div style="margin-bottom: 15px; padding: 8px 12px; background: #fdf6ec; border-radius: 4px; color: #e6a23c;">
        <i class="el-icon-info" style="margin-right: 8px;"></i>
        这个剧本包含 ${wildcards.length} 处需要填写的内容，确认后将进入填写界面
      </div>
    ` + previewHtml;
  }

  // 先显示预览
  return showConfirm(previewHtml, script, {
    title: script.title ? `剧本预览 - ${script.title}` : '剧本预览',
    confirmButtonText: wildcards.length > 0 ? '下一步' : '使用该剧本',
    cancelButtonText: '取消',
    customClass: 'preview-dialog-initial',
    showClose: true,
  }).then(() => {
    if (wildcards.length === 0) {
      return rawContent;
    }

    // 有通配符时，显示填写界面
    return promptWildcards(wildcards)
      .then(selections => {
        const finalContent = fillWildcards(rawContent, selections);
        
        // 显示最终预览
        let finalPreview = finalContent;
        
        // 添加作者和标签信息
        if (script.authorLink || (script.tags && script.tags.length)) {
          finalPreview += `<hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">`;
          if (script.authorLink) {
            finalPreview += `<div style="color: #666; font-size: 14px;">`;
            if (script.authorName) {
              finalPreview += `作者：<a href="${script.authorLink}" target="_blank" style="color: #409eff;">${script.authorName}</a>`;
            } else {
              finalPreview += `<a href="${script.authorLink}" target="_blank" style="color: #409eff;">作者链接</a>`;
            }
            finalPreview += '</div>';
          }
          if (script.tags && script.tags.length) {
            finalPreview += `<div style="color: #666; font-size: 14px; margin-top: 5px;">标签：${script.tags.join(', ')}</div>`;
          }
        }

        // 显示最终确认对话框
        return showConfirm(finalPreview, script, {
          title: '确认使用该剧本',
          confirmButtonText: '确定使用',
          cancelButtonText: '返回修改',
          customClass: 'preview-dialog-final',
          showClose: true,
        }).then(() => finalContent);
      });
  });
}

export default confirmUseScript; 