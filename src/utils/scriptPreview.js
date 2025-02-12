// 该工具模块用于显示剧本预览并确认是否使用剧本，同时内置通配符处理功能
import { ElMessageBox } from 'element-plus';

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
 * 依次提示用户填写所有的通配符项，返回填写结果
 * @param {Array} wildcards - 通配符数组（由 extractWildcards 得到）
 * @returns {Promise<Object>} 返回映射对象：键为通配符索引，值为玩家填写的内容
 */
function promptWildcards(wildcards) {
  return new Promise((resolve, reject) => {
    let selections = {};
    let index = 0;
    const ask = () => {
      if (index >= wildcards.length) {
        resolve(selections);
        return;
      }
      const wc = wildcards[index];
      // 构造提示信息，仅显示提示文本；可选项通过输入框 placeholder 呈现，避免暴露通配符格式
      const message = wc.prompt;
      ElMessageBox.prompt(message, '请输入', {
        inputValue: wc.defaultValue,
        placeholder: `可选项：${wc.options.join('、')}`,
        inputPattern: /.+/,
        inputErrorMessage: '输入不能为空'
      })
        .then(({ value }) => {
          selections[index] = value;
          index++;
          ask();
        })
        .catch(error => {
          reject(error);
        });
    };
    if (wildcards.length > 0) {
      ask();
    } else {
      resolve(selections);
    }
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
  // 原始剧本文本
  const rawContent = script.content || '';

  // 基本预览内容（原始剧本文本加上作者/标签信息，仅用于预览）
  let basePreview = rawContent;
  if (script.authorLink) {
    if (script.authorName) {
      basePreview += `<br/><a href="${script.authorLink}" target="_blank" rel="noopener" style="color: blue; text-decoration: underline;">作者：${script.authorName}</a>`;
    } else {
      basePreview += `<br/><a href="${script.authorLink}" target="_blank" rel="noopener" style="color: blue; text-decoration: underline;">作者链接</a>`;
    }
  } else if (script.tags && script.tags.length) {
    basePreview += `<br/><span>标签：${script.tags.join(', ')}</span>`;
  }

  // 先提取剧本中的通配符（仅从原始剧本文本中提取，不包含附加内容）
  const wildcards = extractWildcards(rawContent);
  console.log('wildcards', wildcards);
  if (wildcards.length === 0) {
    // 没有通配符需要填写，直接显示预览但最终返回原始剧本文本（去除附加内容）
    return showConfirm(basePreview, script, options)
      .then(() => rawContent);
  } else {
    // 有通配符：先显示初始预览对话框，预览内容中用 {提示} 替换通配符（不暴露选项和模板）
    const initialPreview = basePreview.replace(wildcardRegex, (match, prompt, optionsStr, template) => {
      return `{${prompt.trim()}}`;
    });
    return showConfirm(initialPreview, script, options)
      .then(() => {
        return promptWildcards(wildcards)
          .then(selections => {
            // 使用原始剧本文本进行通配符替换，去除附加的作者/标签信息
            const finalPreview = fillWildcards(rawContent, selections);
            // 显示最终确认对话框，告知玩家填写后的最终效果
            return showConfirm(finalPreview, script, {
              title: script.title ? `剧本最终预览 - ${script.title}` : '剧本最终预览',
              confirmButtonText: '确定使用该剧本',
              cancelButtonText: '取消'
            })
            .then(() => finalPreview);
          });
      });
  }
}

export default confirmUseScript; 