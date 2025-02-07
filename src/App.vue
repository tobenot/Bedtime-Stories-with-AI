<template>
  <div class="app-container flex h-screen">
    <!-- 桌面版侧边栏 -->
    <div class="sidebar w-64 hidden md:flex flex-col custom-scrollbar">
      <div class="sidebar-header p-4 border-b">
        <el-button class="btn-primary w-full" @click="createNewChat">
          <el-icon><Plus /></el-icon> 新对话
        </el-button>
      </div>
      <div class="chat-list flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ChatItem
          v-for="chat in chatHistory"
          :key="chat.id"
          :chat="chat"
          :active="currentChatId === chat.id"
          @switch="switchChat"
          @delete="deleteChat"
        />
      </div>
      
      <!-- 新增QQ群按钮使用自定义小按钮样式 -->
      <div class="qq-groups p-4 border-t mt-4">
        <el-button class="btn-small w-full mb-2" @click="joinGroup('软件群')">
          加入QQ群【与AI的睡前故事】
        </el-button><br>
        <el-button class="btn-small w-full" @click="joinGroup('作者粉丝群')">
          加入QQ群【丶青萝卜的母港】
        </el-button>
      </div>
    </div>

    <!-- 移动端侧边栏 -->
    <div
      class="sidebar fixed left-0 w-64 bg-gray-50 border-r flex flex-col md:hidden z-50 top-16 bottom-0"
      v-if="showSidebar"
    >
      <!-- 侧边栏内容保持不变 -->
      <div class="sidebar-header p-4 border-b">
        <el-button class="btn-primary w-full" @click="createNewChat">
          <el-icon><Plus /></el-icon> 新对话
        </el-button>
      </div>
      <div class="chat-list flex-1 overflow-y-auto p-4">
        <ChatItem
          v-for="chat in chatHistory"
          :key="chat.id"
          :chat="chat"
          :active="currentChatId === chat.id"
          @switch="mobileSwitch"
          @delete="deleteChat"
        />
      </div>
      
      <!-- 移动端新增的QQ群按钮 -->
      <div class="qq-groups p-4 border-t mt-4">
        <el-button class="btn-small w-full mb-2" @click="joinGroup('软件群')">
          加入QQ群【与AI的睡前故事】
        </el-button>
        <el-button class="btn-small w-full" @click="joinGroup('作者粉丝群')">
          加入QQ群【丶青萝卜的母港】
        </el-button>
      </div>
    </div>

    <!-- 移动端侧边栏遮罩 -->
    <div
      class="sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      v-if="showSidebar"
      @click="showSidebar = false"
    ></div>

    <!-- 主内容区 -->
    <div class="main-content flex-1 flex flex-col">
      <!-- 共用头部：无论桌面还是移动端都显示 -->
      <div class="header sticky top-0 z-50 flex items-center justify-between p-4 bg-primary text-white border-b border-primary-light">
        <!-- 仅移动端显示菜单按钮 -->
        <button class="menu-button md:hidden text-white" @click="showSidebar = true">
          <el-icon><Expand /></el-icon>
        </button>
        <div class="flex items-center gap-2">
          <h2 class="text-lg text-white font-medium">{{ currentChat?.title || '与AI的睡前故事' }}</h2>
        </div>
        <div class="header-actions flex items-center gap-2">
          <el-button class="btn-secondary text-white border-white hover:bg-white/10" @click="exportToPDF" :disabled="!currentChat?.messages?.length">
            <el-icon><Download /></el-icon>
          </el-button>
          <el-button class="btn-secondary text-white border-white hover:bg-white/10" @click="showSettings = true">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </div>

      <el-main class="message-list flex-1 overflow-y-auto p-5 mt-16 md:mt-0 custom-scrollbar">
        <template v-if="!apiKey">
          <div class="empty-state text-center p-5">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                <div class="text-lg font-semibold text-primary">请先设置API Key</div>
              </template>
              <template #default>
                <div class="text-base text-customGray">
                  请前往 <a href="https://cloud.siliconflow.cn/i/M9KJQRfy" target="_blank" class="text-secondary underline">硅基流动(本项目邀请码)</a><br> 或 <a href="https://cloud.siliconflow.cn/i/FuAPK085" target="_blank" class="text-secondary underline">(父项目邀请码)<br></a> 注册账号，获取您的 API Key<br>通过任一邀请码注册的新注册用户有14元免费额度。
                  <br>
                  点击右上角
                  <el-button type="text" class="inline-block text-blue-500 p-0" @click="showSettings = true">
                    <el-icon><Setting /></el-icon> 设置
                  </el-button>
                  按钮配置您的API Key
                </div>
              </template>
            </el-alert>
          </div>
        </template>
        <template v-else-if="!currentChat?.messages?.length">
          <div class="empty-state text-center p-5">
            <div class="empty-state-icon mb-4">
              <img src="./logo.svg" alt="Logo" class="w-12 h-12 inline-block" />
            </div>
            <h3 class="empty-state-title text-2xl font-semibold text-primary mb-2">开始新的对话</h3>
            <p class="empty-state-description text-base text-customGray mb-4">
              如果你要把这里当做普通的对话，请直接像在官方app那样使用~<br>
              如果你要玩剧本，请选择剧本，或者自己在下方输入框输入你想要的故事开头！
            </p>
            <el-button class="btn-small" @click="focusInput">手动输入</el-button>
            <el-button class="btn-small ml-2" @click="openScriptPanel">选择剧本</el-button>
          </div>
        </template>
        <template v-else>
          <div 
            v-for="(msg, index) in currentChat.messages" 
            :key="index" 
            class="message-bubble" 
            :class="msg.role === 'user' ? 'user-message' : 'assistant-message'">
            <div v-if="msg.role === 'user'" v-html="renderMarkdown(msg.content)"></div>
            <template v-else>
              <template v-if="msg.reasoning_content">
                <div class="reasoning-content bg-reasoningBg text-white p-2 rounded mb-2">
                  <div class="flex items-center mb-1">
                    <div class="reasoning-toggle cursor-pointer mr-2" @click="toggleReasoning(index)">
                      <el-icon>
                        <component :is="msg.isReasoningCollapsed ? 'ArrowRight' : 'ArrowDown'" />
                      </el-icon>
                    </div>
                    <span class="font-bold">思考过程</span>
                  </div>
                  <div class="reasoning-body" :class="{ collapsed: msg.isReasoningCollapsed }">
                    {{ msg.reasoning_content }}
                  </div>
                </div>
              </template>
              <div class="markdown-content" v-html="renderMarkdown(msg.content)"></div>
            </template>
          </div>
          <div v-if="isTyping" class="message-bubble assistant-message">
            <div class="typing-indicator">
              <div class="dot" style="animation-delay: 0s"></div>
              <div class="dot" style="animation-delay: 0.2s"></div>
              <div class="dot" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </template>
      </el-main>

      <div class="input-footer p-4 glass-effect border-t border-secondary/20">
        <el-row :gutter="10">
          <el-col :span="20">
            <el-input
              class="input-area"
              ref="messageInput"
              v-model="inputMessage"
              type="textarea"
              :autosize="{ minRows: 2, maxRows: 10 }"
              :disabled="!apiKey"
              placeholder="输入你的消息..."
              @keydown.native.ctrl.enter.prevent="sendMessage"
            ></el-input>
          </el-col>
          <el-col :span="4">
            <el-button
              class="btn-primary w-full h-full"
              :loading="isLoading"
              :disabled="!apiKey"
              @click="sendMessage"
            >
              发送
            </el-button>
          </el-col>
        </el-row>
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          class="mt-2"
        ></el-alert>
      </div>
    </div>
  </div>

  <!-- 设置抽屉 -->
  <el-drawer
    v-model="showSettings"
    title="设置"
    direction="rtl"
    size="80%"
    :destroy-on-close="false"
    class="settings-drawer"
  >
    <div class="settings-drawer p-4">
      <el-form label-width="80px">
        <!-- API Key 输入 -->
        <el-form-item label="API Key">
          <el-input
            v-model="apiKey"
            type="password"
            placeholder="请输入您的API Key"
            show-password
            @input="saveApiKey"
            autocomplete="off"
          ></el-input>
          <div class="mt-1 text-gray-600 text-sm">
            请前往&nbsp;
            <a href="https://cloud.siliconflow.cn/i/M9KJQRfy" target="_blank" class="text-secondary underline">
              硅基流动 
            </a>
            &nbsp;获取。输入后将安全地存储在您的浏览器中。
          </div>
        </el-form-item>

        <!-- 新增温度设置项 -->
        <el-form-item label="温度">
          <el-slider class="custom-slider" v-model="temperature" :min="0" :max="1" :step="0.1" show-tooltip></el-slider>
          <div class="mt-1 text-gray-600 text-sm">
            温度参数决定回答的随机性。较低的温度（如0.3）使回答更确定，而较高的温度（如0.7）则使回答更具创造性和随机性。
          </div>
        </el-form-item>

        <!-- 模型选择 -->
        <el-form-item label="选择模型">
          <el-select v-model="model" class="w-full" placeholder="选择模型" @change="saveModel">
            <el-option
              v-for="item in models"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <div class="mt-1 text-gray-600 text-sm">
            R1：深度思考。
            <br/>
            V3：不开深度思考，比较便宜但没那么聪明。
          </div>
        </el-form-item>

        <!-- 新增默认隐藏思考过程设置项 -->
        <el-form-item label="隐藏思考">
          <el-switch
            v-model="defaultHideReasoning"
            active-color="#409EFF"
            inactive-color="#dcdfe6"
            @change="saveDefaultHideReasoning"
          ></el-switch>
          <div class="mt-1 text-gray-600 text-sm">
            &nbsp;&nbsp;开启后，助手的思考过程将默认隐藏，点击图标可展开/折叠。
          </div>
        </el-form-item>
      </el-form>
      <div class="mt-1 text-gray-600 text-sm">
        电脑端可以使用Ctrl+Enter发送消息
      </div>
      <div class="mt-1 text-gray-600 text-sm">
        从现象中推测，硅基流动在单次回复中超过五分钟就会直接截断，可能会导致正文不完整。如果你遇到类似问题，可以尝试让它精简思考长度。
      </div>
    </div>
  </el-drawer>

  <!-- Footer -->
  <div class="footer p-4 bg-white border-t text-center text-gray-600 text-sm">
    <el-button type="text" @click="showAuthorInfo = true" class="ml-2">
      <el-icon><InfoFilled /></el-icon>
    </el-button>
    作者: <a href="https://tobenot.top/" target="_blank" class="text-secondary hover:underline">tobenot</a> &amp; © 2025 父项目作者: <a href="https://www.huasheng.ai" target="_blank" class="text-secondary hover:underline">花生</a>
  </div>

  <!-- 作者信息弹窗 -->
  <el-dialog
    v-model="showAuthorInfo"
    title="关于作者"
    width="90%"
    :max-width="500"
    class="author-dialog"
  >
    <el-tabs type="card">
      <el-tab-pane label="本项目作者">
        <div class="author-info p-4">
          <h3 class="text-lg font-semibold">tobenot (丶青萝卜)</h3>
          <div class="author-desc text-gray-600 mt-2">
            <p>AI动漫，AI剧本杀，AI文明，反正都不火</p>
            <p>5个Steam独游，反正都不火</p>
            <p>晚上喜欢和AI玩剧本杀所以就做了这个</p>
            <p>在做AI开放世界</p>
          </div>
          <div class="social-links grid grid-cols-2 gap-3 mt-4">
            <a href="https://space.bilibili.com/23122362/" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><VideoPlay /></el-icon> Bilibili
            </a>
            <a href="https://www.xiaohongshu.com/user/profile/5c03942800000000050142ab" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><Picture /></el-icon> 小红书
            </a>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="父项目作者">
        <div class="author-info p-4">
          <h3 class="text-lg font-semibold">花生 (AI进化论-花生)</h3>
          <div class="author-desc text-gray-600 mt-2">
            <p>AI Native Coder｜第一代不会写代码的独立开发者</p>
            <p>AppStore 付费榜 Top1「小猫补光灯」开发者</p>
            <p>10万+粉AI博主</p>
            <p>微软｜LinkedIn AI课程讲师</p>
            <p>全球旅居中...66%的数字游民</p>
          </div>
          <div class="social-links grid grid-cols-2 gap-3 mt-4">
            <a href="https://www.youtube.com/@alchain" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><VideoCamera /></el-icon> YouTube
            </a>
            <a href="https://space.bilibili.com/14097567" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><VideoPlay /></el-icon> Bilibili
            </a>
            <a href="https://www.xiaohongshu.com/user/profile/5abc6f17e8ac2b109179dfdf" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><Picture /></el-icon> 小红书
            </a>
            <a href="https://x.com/AlchainHust" target="_blank" class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded hover:bg-gray-200">
              <el-icon><Message /></el-icon> Twitter
            </a>
            <div class="social-link flex items-center gap-2 p-2 bg-gray-100 rounded">
              <el-icon><ChatDotRound /></el-icon> 微信公众号：花叔
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>

  <!-- 引入剧本选择组件 -->
  <ScriptSelector v-model="showScriptPanel" :scripts="scripts" @script-selected="selectScript" />
</template>

<script>
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';
import ChatItem from './components/ChatItem.vue';
import ScriptSelector from './components/ScriptSelector.vue';
import scripts from './config/scripts.js';

export default {
  components: {
    ChatItem,
    ScriptSelector,
  },
  data() {
    return {
      messages: [],
      inputMessage: '',
      model: localStorage.getItem('model') || 'deepseek-ai/DeepSeek-R1',
      models: [
        'deepseek-ai/DeepSeek-R1',
        'deepseek-ai/DeepSeek-V3',
        'meta-llama/Llama-3.3-70B-Instruct'
      ],
      temperature: 1,
      isLoading: false,
      isTyping: false,
      errorMessage: '',
      apiKey: localStorage.getItem('deepseek_api_key') || '',
      showSettings: false,
      showSidebar: false,
      chatHistory: [],
      currentChatId: null,
      showAuthorInfo: false,
      showScriptPanel: false,
      scripts: scripts,
      defaultHideReasoning: JSON.parse(localStorage.getItem('default_hide_reasoning') || 'false')
    }
  },
  computed: {
    currentChat() {
      return this.chatHistory.find(chat => chat.id === this.currentChatId)
    }
  },
  created() {
    const savedHistory = localStorage.getItem('chat_history')
    if (savedHistory) {
      this.chatHistory = JSON.parse(savedHistory)
      if (this.chatHistory.length > 0) {
        this.currentChatId = this.chatHistory[0].id
      }
    }
    if (!this.currentChatId) {
      this.createNewChat()
    }
  },
  methods: {
    saveApiKey() {
      localStorage.setItem('deepseek_api_key', this.apiKey)
    },
    saveModel() {
      localStorage.setItem('model', this.model)
    },
    saveDefaultHideReasoning() {
      localStorage.setItem('default_hide_reasoning', JSON.stringify(this.defaultHideReasoning));
    },
    createNewChat() {
      const newChat = {
        id: Date.now(),
        title: '新对话',
        messages: [],
        createdAt: new Date().toISOString()
      }
      this.chatHistory.unshift(newChat)
      this.currentChatId = newChat.id
      this.saveChatHistory()
      this.showSidebar = false
    },
    switchChat(chatId) {
      this.currentChatId = chatId
      this.showSidebar = false
    },
    deleteChat(chatId) {
      const index = this.chatHistory.findIndex(chat => chat.id === chatId)
      if (index !== -1) {
        this.chatHistory.splice(index, 1)
        if (this.chatHistory.length === 0) {
          this.createNewChat()
        } else {
          this.currentChatId = this.chatHistory[0].id
        }
        this.saveChatHistory()
      }
    },
    saveChatHistory() {
      localStorage.setItem('chat_history', JSON.stringify(this.chatHistory))
    },
    focusInput() {
      this.$refs.messageInput.focus()
    },
    updateChatTitle(message) {
      if (!this.currentChat.title || this.currentChat.title === '新对话') {
        this.currentChat.title = message.slice(0, 10) + (message.length > 10 ? '...' : '')
        this.saveChatHistory()
      }
    },
    toggleReasoning(index) {
      this.currentChat.messages[index].isReasoningCollapsed =
        !this.currentChat.messages[index].isReasoningCollapsed;
      this.saveChatHistory();
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = document.querySelector('.message-list');
        if (container) {
          const threshold = 50; // 阈值：如果用户距离底部超过50像素，则不自动滚动
          // 只有当用户接近底部时才自动滚动到底部
          if (container.scrollTop + container.clientHeight + threshold >= container.scrollHeight) {
            container.scrollTop = container.scrollHeight;
          }
        }
      });
    },
    async sendMessage() {
      if (!this.inputMessage.trim() || this.isLoading || !this.apiKey) return

      const message = this.inputMessage.trim()
      this.inputMessage = ''
      this.updateChatTitle(message)

      try {
        this.isLoading = true
        this.isTyping = true
        this.errorMessage = ''

        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        }
        this.currentChat.messages.push(userMessage)

        const assistantMessage = {
          role: 'assistant',
          content: '',
          reasoning_content: '',
          isReasoningCollapsed: this.defaultHideReasoning,
          timestamp: new Date().toISOString()
        }
        this.currentChat.messages.push(assistantMessage)

        const requestBody = {
          model: this.model,
          messages: this.currentChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: true,
          temperature: this.temperature,
          max_tokens: 4096
        }

        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(`API请求失败: ${response.status} - ${errorBody}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())

          for (const line of lines) {
            if (line === 'data: [DONE]') break
            try {
              const jsonStr = line.replace('data: ', '')
              if (!jsonStr.trim()) continue;
              const data = JSON.parse(jsonStr)

              if (data.code) {
                console.error('API 错误:', data.message)
                throw new Error(`API returned error: ${data.message}`)
              }

              const currentMessage = this.currentChat.messages[this.currentChat.messages.length - 1]

              if (data.choices[0]?.delta?.reasoning_content !== undefined) {
                currentMessage.reasoning_content += data.choices[0].delta.reasoning_content || ''
              }
              if (data.choices[0]?.delta?.content !== null && data.choices[0]?.delta?.content !== undefined) {
                currentMessage.content += data.choices[0].delta.content || ''
              }
              this.currentChat.messages = [...this.currentChat.messages]
              this.scrollToBottom()
            } catch (error) {
              console.error('数据解析错误:', error, '原始数据:', line)
            }
          }
        }
        this.saveChatHistory()
      } catch (error) {
        this.errorMessage = `请求失败: ${error.message}`
        this.inputMessage = message;
        this.currentChat.messages.pop()
      } finally {
        this.isLoading = false
        this.isTyping = false
        this.scrollToBottom()
      }
    },
    renderMarkdown(content) {
      if (!content) return '';
      try {
        return marked.parse(content);
      } catch (error) {
        console.error('Markdown 渲染错误:', error);
        return content;
      }
    },
    async copyMessage(content) {
      try {
        await navigator.clipboard.writeText(content);
        this.$message({
          message: '复制成功',
          type: 'success',
          duration: 2000
        });
      } catch (err) {
        this.$message({
          message: '复制失败，请手动复制',
          type: 'error',
          duration: 2000
        });
      }
    },
    async exportToPDF() {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'export-content';
        
        tempDiv.innerHTML = `
          <h1 class="mb-2">${this.currentChat.title || '聊天记录'}</h1>
          <div class="mb-5 text-customGray">
            创建时间：${new Date(this.currentChat.createdAt).toLocaleString('zh-CN')}
          </div>
        `;
        
        this.currentChat.messages.forEach(msg => {
          const messageDiv = document.createElement('div');
          messageDiv.classList.add('my-4', 'p-4', 'border', 'border-gray-200', 'page-break-avoid');
          
          const headerDiv = document.createElement('div');
          headerDiv.classList.add('mb-2', 'flex', 'justify-between');
          
          const roleSpan = document.createElement('span');
          roleSpan.classList.add('font-bold');
          roleSpan.textContent = msg.role === 'user' ? '用户' : this.model;
          headerDiv.appendChild(roleSpan);
          
          const timeSpan = document.createElement('span');
          timeSpan.classList.add('text-gray-600', 'text-xs');
          timeSpan.textContent = new Date(msg.timestamp).toLocaleString('zh-CN');
          headerDiv.appendChild(timeSpan);
          
          messageDiv.appendChild(headerDiv);
          
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
          
          const contentDiv = document.createElement('div');
          contentDiv.classList.add('whitespace-pre-wrap');
          if (msg.role === 'assistant') {
            const tempElement = document.createElement('div');
            tempElement.innerHTML = this.renderMarkdown(msg.content);
            contentDiv.textContent = this.extractTextFromMarkdown(tempElement);
          } else {
            contentDiv.textContent = msg.content;
          }
          
          messageDiv.appendChild(contentDiv);
          tempDiv.appendChild(messageDiv);
        });
        
        const opt = {
          margin: [15, 15],
          filename: `${this.currentChat.title || '聊天记录'}.pdf`,
          pagebreak: { mode: 'avoid-all' },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
  
        document.body.appendChild(tempDiv);
        
        try {
          await html2pdf().set(opt).from(tempDiv).save();
          this.$message({
            message: 'PDF导出成功',
            type: 'success',
            duration: 2000
          });
        } finally {
          document.body.removeChild(tempDiv);
        }
      } catch (error) {
        console.error('PDF导出失败:', error);
        this.$message({
          message: 'PDF导出失败',
          type: 'error',
          duration: 2000
        });
      }
    },
    extractTextFromMarkdown(element) {
      let text = '';
      const nodes = element.childNodes;
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          switch (node.tagName.toLowerCase()) {
            case 'p':
              text += this.extractTextFromMarkdown(node);
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
              text += this.extractTextFromMarkdown(node).toUpperCase();
              break;
            case 'ul':
            case 'ol':
              text += this.extractTextFromMarkdown(node);
              break;
            case 'li':
              text += '• ' + this.extractTextFromMarkdown(node);
              break;
            case 'code':
            case 'pre':
              text += this.extractTextFromMarkdown(node);
              break;
            default:
              text += this.extractTextFromMarkdown(node);
          }
        }
      }
      return text.trim();
    },
    confirmDelete() {
      console.log('confirmDelete called for chat id =', this.currentChatId)
      this.$confirm('确定删除该对话吗？', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          console.log('User confirmed delete')
          this.deleteChat(this.currentChatId)
        })
        .catch(() => {
          console.log('User canceled delete')
          // 用户取消删除，不做处理
        })
    },
    mobileSwitch(id) {
      this.switchChat(id)
      this.showSidebar = false
    },
    openScriptPanel() {
      console.log('[App] openScriptPanel clicked, setting showScriptPanel to true');
      this.showScriptPanel = true;
    },
    selectScript(script) {
      console.log('[App] script selected:', script);
      this.inputMessage = script.content;
      this.focusInput();
    },
    joinGroup(groupName) {
      let url = ''
      if (groupName === '软件群') {
        url = 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=PIlY1ohFyAaT_kUWnu3MBV0I4B5bKkth&authKey=VAPHwBjqO27MTXwN5k9OsZAp9BulERgk5DHA2Wo%2BxZKbz1RAgjCXXK9NHM3PZ0T0&noverify=0&group_code=1028832603'
      } else if (groupName === '作者粉丝群') {
        url = 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=wnanEY5EFnmZkgsxB8Ekm3_rF0wEfC-m&authKey=unYZXpjELI9S9BFaLyKZssgbItkEPNnDcaYJ0jOn7Vdk4UGJZNw97wBpML6QW8hV&noverify=0&group_code=1028122611'
      }
      if (url) {
        window.open(url, '_blank')
      }
    }
  }
}
</script>

<style src="./index.css"></style>

<style>
/* 添加自定义样式以隐藏折叠状态下的思考过程 */
.reasoning-body.collapsed {
  display: none;
}

.qq-groups .el-button {
  margin-bottom: 10px;
}
.qq-groups .el-button:last-child {
  margin-bottom: 0;
}

/* 自定义温度滑动条样式 */
.custom-slider .el-slider__runway {
  height: 8px;
  border-radius: 4px;
  background-color: #dcdfe6;
}
.custom-slider .el-slider__bar {
  height: 8px;
  border-radius: 4px;
  background-color: #409EFF;
}
.custom-slider .el-slider__button {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: none;
  background-color: #409EFF;
  box-shadow: none;
}
</style> 