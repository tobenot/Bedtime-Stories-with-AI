import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './index.css' // Tailwind CSS 样式

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 导入并初始化 Highlight.js
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css' // 选择一个 Highight.js 主题样式

hljs.configure({
  ignoreUnescapedHTML: true
})

// 导入 Marked.js
import { marked } from 'marked'

// 导入 html2pdf.js（如果需要在全局使用）
import html2pdf from 'html2pdf.js'

// 配置 Marked.js
const renderer = new marked.Renderer()

// 自定义表格渲染
renderer.table = function(header, body) {
  return '<div class="table-container"><table class="min-w-full">\n'
      + '<thead>\n'
      + header
      + '</thead>\n'
      + '<tbody>\n'
      + body
      + '</tbody>\n'
      + '</table></div>\n'
}

// 自定义代码块渲染
renderer.code = function(code, language) {
  const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`;
}

// 设置 Marked.js 选项
marked.setOptions({
  renderer: renderer,
  gfm: true,
  breaks: true,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  xhtml: false,
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (__) {}
    }
    return hljs.highlightAuto(code).value;
  }
})

// 将 Marked.js 和 Highlight.js 挂载到 Vue 原型，以便在组件中全局使用
const app = createApp(App)

app.config.globalProperties.$marked = marked
app.config.globalProperties.$hljs = hljs
app.config.globalProperties.$html2pdf = html2pdf

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus).mount('#app') 