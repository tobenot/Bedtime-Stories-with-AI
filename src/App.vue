<!-- 是Vue3！！ -->
<template>
  <div class="app-container flex h-screen">
    <!-- 桌面版侧边栏 -->
    <div class="sidebar w-82 hidden md:flex flex-col scrollbar scrollbar-thumb-gray-500 scrollbar-track-gray-200">
      <div class="sidebar-header p-4 border-b">
        <el-button class="btn-primary w-full" @click="createNewChat">
          <el-icon><Plus /></el-icon> 新对话
        </el-button>
      </div>
      <div class="chat-list flex-1 overflow-y-auto p-4 scrollbar scrollbar-thumb-gray-500 scrollbar-track-gray-200">
        <ChatItem
          v-for="chat in chatHistory"
          :key="chat.id"
          :chat="chat"
          :active="currentChatId === chat.id"
          @switch="switchChat"
          @delete="deleteChat"
          @update-title="changeChatTitle"
        />
      </div>
      
      <div class="qq-groups p-4 border-t mt-4">
        <el-button class="btn-small w-full" @click="joinGroup('作者粉丝群')">
          加入交流群【丶青萝卜的母港】
        </el-button>
      </div>
    </div>

    <!-- 移动端侧边栏 -->
    <div
      class="sidebar fixed left-0 w-82 bg-gray-50 border-r flex flex-col md:hidden z-50 top-16 bottom-0"
      v-if="showSidebar"
    >
      <!-- 侧边栏内容保持不变 -->
      <div class="sidebar-header p-4 border-b">
        <el-button class="btn-primary w-full" @click="createNewChat">
          <el-icon><Plus /></el-icon> 新对话
        </el-button>
      </div>
      <div class="chat-list flex-1 overflow-y-auto p-4 scrollbar scrollbar-thumb-gray-500 scrollbar-track-gray-200">
        <ChatItem
          v-for="chat in chatHistory"
          :key="chat.id"
          :chat="chat"
          :active="currentChatId === chat.id"
          @switch="mobileSwitch"
          @delete="deleteChat"
          @update-title="changeChatTitle"
        />
      </div>
      
      <div class="qq-groups p-4 border-t mt-4">
        <el-button class="btn-small w-full" @click="joinGroup('作者粉丝群')">
          加入交流群【丶青萝卜的母港】
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
        <button class="menu-button md:hidden text-white" @click="toggleSidebar">
          <el-icon><Expand /></el-icon>
        </button>
        <div class="flex items-center gap-2">
          <h2 class="text-lg text-white font-medium">{{ currentChat?.title || '与AI的睡前故事' }}</h2>
        </div>
        <div class="header-actions flex items-center gap-4">
          <el-dropdown trigger="click" @command="handleToolboxCommand">
            <template #default>
              <button class="header-action-button">
                <el-icon><Briefcase /></el-icon>
              </button>
            </template>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="copyChat">复制对话(开if线)</el-dropdown-item>
                <el-dropdown-item command="localScriptEditor">本地剧本编辑器</el-dropdown-item>
                <el-dropdown-item command="exportTxtNovel">导出txt小说</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button class="header-action-button" @click="exportToPDF" :disabled="!currentChat?.messages?.length">
            <el-icon><Printer /></el-icon>
          </button>
          <button class="header-action-button" @click="showSettings = true">
            <el-icon><Setting /></el-icon>
          </button>
        </div>
      </div>

      <el-main ref="messageContainer" :class="['message-list', 'flex-1', 'overflow-y-auto', 'p-5', showSidebar ? 'mt-16' : 'mt-0', 'md:mt-0', 'scrollbar', 'scrollbar-thumb-gray-500', 'scrollbar-track-gray-200']">
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
                  <el-button type="link" class="inline-block text-blue-500 p-0" @click="showSettings = true">
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
            <div class="software-info mb-4">
              <h1 class="software-title text-3xl font-bold text-primary">与AI的睡前故事</h1>
              <p class="software-author text-lg text-gray-700">作者：tobenot</p>
              <p class="software-message text-sm text-gray-600">因为喜欢和AI玩文字游戏和聊各种东西，所以做了这个项目，希望你也喜欢！</p>
            </div>
            <h3 class="empty-state-title text-2xl font-semibold text-primary mb-2">开始新的对话吧！</h3>
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
            <div v-if="msg.role === 'user'">
              <div v-html="renderMarkdown(msg.content)"></div>
              <div class="message-controls mt-2 flex justify-start">
                <el-tooltip content="复制" placement="top">
                  <el-button class="btn-copy" @click="copyMessage(msg.content)">
                    <el-icon style="font-size: 1.6rem;"><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑" placement="top">
                  <el-button class="btn-edit" @click="enableEditMessage(index)">
                    <el-icon style="font-size: 1.6rem;"><Edit /></el-icon>
                  </el-button>
                </el-tooltip>
                <template v-if="index === currentChat.messages.length - 1 && !isTyping">
                  <el-tooltip content="重新生成" placement="top">
                    <el-button class="btn-refresh" @click="confirmRegenerateMessage">
                      <el-icon style="font-size: 1.6rem;"><Refresh /></el-icon>
                    </el-button>
                  </el-tooltip>
                </template>
                <el-tooltip content="删除" placement="top">
                  <el-button class="btn-delete" @click="confirmDeleteMessage(index)">
                    <el-icon style="font-size: 1.6rem;"><Delete /></el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </div>
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
                  <div class="reasoning-body" :class="{ collapsed: msg.isReasoningCollapsed }" v-html="renderMarkdown(msg.reasoning_content)">
                  </div>
                </div>
              </template>
              <div class="markdown-content" v-html="renderMarkdown(msg.content)"></div>
              <div class="assistant-controls mt-2 flex justify-start">
                <el-tooltip content="复制" placement="top">
                  <el-button class="btn-copy" @click="copyMessage(msg.content)">
                    <el-icon style="font-size: 1.6rem;"><CopyDocument /></el-icon>
                  </el-button>
                </el-tooltip>
                <template v-if="!(index === currentChat.messages.length - 1 && isTyping)">
                  <el-tooltip content="编辑" placement="top">
                    <el-button class="btn-edit" @click="enableEditMessage(index)">
                      <el-icon style="font-size: 1.6rem;"><Edit /></el-icon>
                    </el-button>
                  </el-tooltip>
                </template>
                <template v-if="index === currentChat.messages.length - 1 && !isTyping">
                  <el-tooltip content="重新生成" placement="top">
                    <el-button class="btn-refresh" @click="confirmRegenerateMessage">
                      <el-icon style="font-size: 1.6rem;"><Refresh /></el-icon>
                    </el-button>
                  </el-tooltip>
                </template>
                <template v-if="!(index === currentChat.messages.length - 1 && isTyping)">
                  <el-tooltip content="删除" placement="top">
                    <el-button class="btn-delete" @click="confirmDeleteMessage(index)">
                      <el-icon style="font-size: 1.6rem;"><Delete /></el-icon>
                    </el-button>
                  </el-tooltip>
                </template>
              </div>
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
              @keydown.native.ctrl.enter.prevent="sendMessage()"
            ></el-input>
          </el-col>
          <el-col :span="4">
            <el-button
              class="btn-primary w-full h-full"
              :disabled="!apiKey"
              @click="handleButtonClick"
            >
              <template v-if="isLoading">
                <i class="el-icon-loading" style="margin-right: 8px;"></i>
                取消
              </template>
              <template v-else>
                发送
              </template>
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

    <!-- 新增：滚动到底部悬浮按钮 -->
    <button
      v-if="showScrollToBottom"
      @click="scrollToBottomManual"
      class="fixed bottom-40 right-10 w-12 h-12 bg-gray-200 rounded-full shadow-neumorphic flex items-center justify-center focus:outline-none z-50"
      title="滚动到底部"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
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
            </a>&nbsp;获取。输入后将安全地存储在您的浏览器中。
          </div>
        </el-form-item>

        <!-- 新增 API 接口设置 -->
        <el-form-item label="API 接口">
          <el-select
            v-model="apiUrl"
            filterable
            allow-create
            placeholder="请选择或输入API接口"
            @change="saveApiUrl"
          >
            <el-option
              v-for="option in apiUrlOptions"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
          <div class="mt-1 text-gray-600 text-sm">
            {{ apiUrlHint }}
          </div>
        </el-form-item>

        <!-- 新增温度设置项 -->
        <el-form-item label="温度">
          <el-slider
            class="custom-slider"
            v-model="temperature"
            :min="0"
            :max="2"
            :step="0.1"
            show-tooltip
            @change="saveTemperature"
          ></el-slider>
          <div class="mt-1 text-gray-600 text-sm">
            温度参数决定回答的随机性。较低的温度（如0.3）使回答更确定，而较高的温度（如1）则使回答更具创造性和随机性。玩文游建议0.7，你可以进行尝试。
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

        <!-- 新增自动折叠旧的思考过程设置项 -->
        <el-form-item label="自动折叠">
          <el-switch
            v-model="autoCollapseReasoning"
            active-color="#409EFF"
            inactive-color="#dcdfe6"
            @change="saveAutoCollapseReasoning"
          ></el-switch>
          <div class="mt-1 text-gray-600 text-sm">
            &nbsp;&nbsp;开启后，每次发送新消息时，之前所有消息的思考过程将自动折叠。
          </div>
        </el-form-item>

        <!-- 新增：对话存档导入导出功能 -->
        <el-divider></el-divider>
        <el-form-item label="对话存档">
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <el-button size="small" @click="exportChatArchive">导出存档</el-button>
            <el-button size="small" type="primary" @click="importChatArchive('merge')">导入存档（合并）</el-button>
            <el-button size="small" type="danger" @click="importChatArchive('overwrite')">导入存档（覆盖）</el-button>
          </div>
        </el-form-item>
        <!-- 结束对话存档功能区 -->
      </el-form>
      <div class="mt-1 text-gray-600 text-sm">
        电脑端可以使用Ctrl+Enter发送消息
      </div>
      <div class="mt-1 text-gray-600 text-sm">
        从现象中推测，硅基流动在单次回复中超过五分钟就会直接截断，可能会导致正文不完整。如果你遇到类似问题，可以尝试让它精简思考长度。
      </div>
      <br>
      <div class="footer p-4 bg-white border-t text-center text-gray-600 text-sm">
        <el-button type="link" @click="showAuthorInfo = true" class="ml-2">
          <el-icon><InfoFilled /></el-icon>
        </el-button>
        作者: <a href="https://tobenot.top/" target="_blank" class="text-secondary hover:underline">tobenot</a> &amp; © 2025 父项目作者: <a href="https://www.huasheng.ai" target="_blank" class="text-secondary hover:underline">花生</a>
      </div>
    </div>
  </el-drawer>

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

  <!-- 使用剧本选择器 -->
  <ScriptSelector v-model="showScriptPanel" :scripts="scripts" @script-selected="selectScript" />

  <!-- 新增：本地剧本编辑器 -->
  <LocalScriptEditor v-model="showLocalScriptEditor" @script-selected="selectScript" />

  <!-- 新增：隐藏的文件上传控件，用于导入存档 -->
  <input
    type="file"
    ref="importFile"
    style="display: none;"
    accept=".json"
    @change="handleImportFile"
  />

  <!-- 修改编辑消息弹窗 -->
  <el-dialog
    v-model="showEditDialog"
    title="编辑消息"
    width="80%"
    :before-close="handleEditDialogClose"
    @opened="handleEditDialogOpened"
  >
    <el-input
      ref="editInput"
      v-model="editingMessage.content"
      type="textarea"
      :rows="10"
      :autosize="{ minRows: 10, maxRows: 20 }"
      placeholder="编辑消息内容..."
    ></el-input>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleEditDialogClose">取消</el-button>
        <el-button type="primary" @click="saveEditedMessageDialog">保存</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 新增：导出txt小说组件 -->
  <TxtNovelExporter :modelValue.sync="showTxtNovelExporter" :chat="currentChat" />
</template>

<script>
import { marked } from 'marked';
import { Refresh, CopyDocument, Delete, Edit, Briefcase, Setting, Expand } from '@element-plus/icons-vue';
import html2pdf from 'html2pdf.js';
import ChatItem from './components/ChatItem.vue';
import ScriptSelector from './components/ScriptSelector.vue';
import LocalScriptEditor from './components/LocalScriptEditor.vue';
import TxtNovelExporter from './components/TxtNovelExporter.vue';
import scripts from './config/scripts.js';
import { exportChatToPDF } from './utils/pdfExporter';
import { MAX_TITLE_LENGTH, COPY_SUFFIX } from '@/config/constants.js';
import confirmUseScript from './utils/scriptPreview.js';

export default {
  components: {
    ChatItem,
    ScriptSelector,
    LocalScriptEditor,
    TxtNovelExporter,
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
      temperature: localStorage.getItem('temperature')
        ? parseFloat(localStorage.getItem('temperature'))
        : 0.7,
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
      showLocalScriptEditor: false,
      scripts: scripts,
      defaultHideReasoning: JSON.parse(localStorage.getItem('default_hide_reasoning') || 'false'),
      autoCollapseReasoning: JSON.parse(localStorage.getItem('auto_collapse_reasoning') || 'false'),
      editingMessageIndex: null,
      importMode: null,
      apiUrl: localStorage.getItem('api_url') || 'https://api.siliconflow.cn/v1/chat/completions',
      apiUrlOptions: [
        'https://api.siliconflow.cn/v1/chat/completions',
        'https://api.deepseek.com/v1/chat/completions'
      ],
      showScrollToBottom: false,
      abortController: null,
      cancelled: false,
      showEditDialog: false,
      editingMessage: {
        index: null,
        content: ''
      },
      showTxtNovelExporter: false,
    }
  },
  computed: {
    currentChat() {
      return this.chatHistory.find(chat => chat.id === this.currentChatId)
    },
    apiUrlHint() {
      if (this.apiUrl === 'https://api.siliconflow.cn/v1/chat/completions') {
        return '当前选择的是硅基流动接口 请使用硅基流动的Key';
      } else if (this.apiUrl === 'https://api.deepseek.com/v1/chat/completions') {
        return '当前选择的是Deepseek官方接口 请使用Deepseek官网的Key';
      } else {
        return '';
      }
    },
    effectiveModel() {
      if (this.apiUrl === 'https://api.deepseek.com/v1/chat/completions') {
        if (this.model === 'deepseek-ai/DeepSeek-R1') {
          return 'deepseek-reasoner';
        } else if (this.model === 'deepseek-ai/DeepSeek-V3') {
          return 'deepseek-chat';
        }
      }
      return this.model;
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
  mounted() {
    let container = this.$refs.messageContainer;
    if (container && container.$el) {
      container = container.$el;
    }
    if (container) {
      container.addEventListener('scroll', this.handleContainerScroll);
    }
  },
  unmounted() {
    let container = this.$refs.messageContainer;
    if (container && container.$el) {
      container = container.$el;
    }
    if (container) {
      container.removeEventListener('scroll', this.handleContainerScroll);
    }
  },
  watch: {
    showSidebar(newVal) {
      document.body.style.overflow = newVal ? 'hidden' : '';
    }
  },
  methods: {
    saveApiKey() {
      localStorage.setItem('deepseek_api_key', this.apiKey)
    },
    saveApiUrl() {
      localStorage.setItem('api_url', this.apiUrl);
    },
    saveModel() {
      localStorage.setItem('model', this.model)
    },
    saveDefaultHideReasoning() {
      localStorage.setItem('default_hide_reasoning', JSON.stringify(this.defaultHideReasoning));
    },
    saveAutoCollapseReasoning() {
      localStorage.setItem('auto_collapse_reasoning', JSON.stringify(this.autoCollapseReasoning));
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
      this.currentChatId = chatId;
      this.showSidebar = false;
      this.$nextTick(() => {
        this.handleContainerScroll();
      });
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
          const threshold = 50;
          if (container.scrollTop + container.clientHeight + threshold >= container.scrollHeight) {
            container.scrollTop = container.scrollHeight;
          }
        }
      });
    },
    async sendMessage(isRegenerate = false) {
      if (isRegenerate) {
        while (
          this.currentChat.messages.length > 0 &&
          this.currentChat.messages[this.currentChat.messages.length - 1].role !== 'user'
        ) {
          this.currentChat.messages.pop();
        }
        this.saveChatHistory();
      } else {
        if (!this.inputMessage.trim() || this.isLoading || !this.apiKey) return;
        var message = this.inputMessage.trim();
        this.inputMessage = '';
        this.updateChatTitle(message);
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        };
        this.currentChat.messages.push(userMessage);
      }

      if (this.autoCollapseReasoning && !isRegenerate) {
        this.currentChat.messages.forEach(msg => {
          if (msg.role === 'assistant' && !msg.isReasoningCollapsed) {
            msg.isReasoningCollapsed = true;
          }
        });
      }

      try {
        this.isLoading = true;
        this.isTyping = true;
        this.errorMessage = '';
        this.abortController = new AbortController();

        const requestBody = {
          model: this.effectiveModel,
          messages: this.currentChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          stream: true,
          temperature: this.temperature,
          max_tokens: 4096
        };

        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          signal: this.abortController.signal,
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API请求失败: ${response.status} - ${errorBody}`);
        }

        const assistantMessage = {
          role: 'assistant',
          content: '',
          reasoning_content: '',
          isReasoningCollapsed: this.defaultHideReasoning,
          timestamp: new Date().toISOString()
        };
        this.currentChat.messages.push(assistantMessage);
        
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

              if (data.code) {
                console.error('API 错误:', data.message);
                throw new Error(`API returned error: ${data.message}`);
              }

              const currentMessage = this.currentChat.messages[this.currentChat.messages.length - 1];

              if (data.choices[0]?.delta?.reasoning_content !== undefined) {
                currentMessage.reasoning_content += data.choices[0].delta.reasoning_content || '';
              }
              if (data.choices[0]?.delta?.content !== null && data.choices[0]?.delta?.content !== undefined) {
                currentMessage.content += data.choices[0].delta.content || '';
              }
              this.currentChat.messages = [...this.currentChat.messages];
              this.scrollToBottom();
            } catch (error) {
              console.error('数据解析错误:', error, '原始数据:', line);
            }
          }
        }
        this.saveChatHistory();
      } catch (error) {
        if (error.name === 'AbortError') {
          this.$message({
            message: '生成已取消',
            type: 'info',
            duration: 2000
          });
        } else {
          this.errorMessage = `请求失败: ${error.message}`;
          if (this.currentChat.messages.length > 0 && 
              this.currentChat.messages[this.currentChat.messages.length - 1].role === 'assistant') {
            this.currentChat.messages.pop();
          }
        }
      } finally {
        this.isLoading = false;
        this.isTyping = false;
        this.abortController = null;
        this.cancelled = false;
        this.scrollToBottom();
      }
    },
    renderMarkdown(content) {
      if (!content) return '';
      try {
        const renderer = new marked.Renderer();
        renderer.del = (text) => `~${text}~`;
        return marked.parse(content, { renderer });
      } catch (error) {
        console.error('Markdown 渲染错误:', error);
        return content;
      }
    },
    async copyMessage(content) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(content);
          this.$message({
            message: '复制成功',
            type: 'success',
            duration: 2000
          });
        } catch (err) {
          this.fallbackCopy(content);
        }
      } else {
        this.fallbackCopy(content);
      }
    },
    fallbackCopy(content) {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message({
            message: '复制成功',
            type: 'success',
            duration: 2000
          });
        } else {
          this.$message({
            message: '复制失败，请手动复制或使用编辑功能然后全选复制',
            type: 'error',
            duration: 2000
          });
        }
      } catch (error) {
        this.$message({
          message: '复制失败，请手动复制或使用编辑功能然后全选复制',
          type: 'error',
          duration: 2000
        });
      }
      document.body.removeChild(textarea);
    },
    async exportToPDF() {
      try {
        await exportChatToPDF(this.currentChat, this.renderMarkdown);
        this.$message({
          message: 'PDF导出成功',
          type: 'success',
          duration: 2000
        });
      } catch (error) {
        console.error('PDF 导出失败:', error);
        this.$message({
          message: 'PDF导出失败',
          type: 'error',
          duration: 2000
        });
      }
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
      confirmUseScript(script)
        .then(finalScript => {
          this.inputMessage = finalScript;
          this.showScriptPanel = false;
          this.$nextTick(() => {
            this.focusInput();
          });
        })
        .catch(error => {
          console.warn('剧本选择已取消或发生错误:', error);
        });
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
    },
    confirmDeleteMessage(index) {
      this.$confirm('确定删除这条消息吗？', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteMessage(index);
        this.$message({
          message: '消息已删除',
          type: 'success',
          duration: 2000
        });
      }).catch(() => {
      });
    },
    deleteMessage(index) {
      this.currentChat.messages.splice(index, 1);
      this.saveChatHistory();
    },
    enableEditMessage(index) {
      this.editingMessage = {
        index: index,
        content: this.currentChat.messages[index].content
      };
      this.showEditDialog = true;
    },
    handleEditDialogClose() {
      this.showEditDialog = false;
      this.editingMessage = {
        index: null,
        content: ''
      };
    },
    saveEditedMessageDialog() {
      const editedContent = this.editingMessage.content.trim();
      if (editedContent) {
        this.currentChat.messages[this.editingMessage.index].content = editedContent;
        this.saveChatHistory();
        this.$message({
          message: '消息已更新',
          type: 'success',
          duration: 2000
        });
        this.handleEditDialogClose();
      } else {
        this.$message({
          message: '消息内容不能为空',
          type: 'warning',
          duration: 2000
        });
      }
    },
    confirmRegenerateMessage() {
      const messages = this.currentChat && this.currentChat.messages ? this.currentChat.messages : [];
      if (messages.length === 0) return;
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        this.sendMessage(true);
        return;
      }
      this.$confirm(
        '确定重新生成这条消息吗？目前这里与官方APP不一样，此操作将永久删除当前消息。',
        '确认重新生成',
        {
          confirmButtonText: '重新生成',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
        .then(() => {
          this.sendMessage(true);
        })
        .catch(() => {
        });
    },
    exportChatArchive() {
      try {
        const jsonData = JSON.stringify(this.chatHistory, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_history_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.$message({
          message: '存档已导出',
          type: 'success',
          duration: 2000
        });
      } catch (error) {
        this.$message({
          message: '导出存档失败',
          type: 'error',
          duration: 2000
        });
      }
    },
    importChatArchive(mode) {
      this.importMode = mode;
      this.$refs.importFile.click();
    },
    handleImportFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        let importedData = null;
        try {
          importedData = JSON.parse(e.target.result);
          if (!Array.isArray(importedData)) {
            throw new Error('导入文件格式错误，应该为聊天历史数组');
          }
        } catch (err) {
          this.$message({
            message: '无法解析文件，请确认文件格式正确。',
            type: 'error',
            duration: 2000
          });
          return;
        }
        if (this.importMode === 'overwrite') {
          this.chatHistory = importedData;
          if (this.chatHistory.length > 0) {
            this.currentChatId = this.chatHistory[0].id;
          } else {
            this.createNewChat();
          }
          this.$message({
            message: '存档已覆盖',
            type: 'success',
            duration: 2000
          });
        } else if (this.importMode === 'merge') {
          this.chatHistory = importedData.concat(this.chatHistory);
          if (!this.currentChatId && this.chatHistory.length > 0) {
            this.currentChatId = this.chatHistory[0].id;
          }
          this.$message({
            message: '存档已合并',
            type: 'success',
            duration: 2000
          });
        }
        this.saveChatHistory();
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    changeChatTitle({ id, title }) {
      const chat = this.chatHistory.find(c => c.id === id);
      if (chat) {
        chat.title = title;
        this.saveChatHistory();
      }
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar;
    },
    saveTemperature() {
      localStorage.setItem('temperature', this.temperature.toString());
    },
    handleContainerScroll() {
      let container = this.$refs.messageContainer;
      if (container && container.$el) {
        container = container.$el;
      }
      if (container) {
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        this.showScrollToBottom = distanceFromBottom > 150;
      }
    },
    scrollToBottomManual() {
      let container = this.$refs.messageContainer;
      if (container && container.$el) {
        container = container.$el;
      }
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    handleButtonClick() {
      if (this.isLoading && this.abortController) {
        this.cancelRequest();
      } else {
        this.sendMessage();
      }
    },
    cancelRequest() {
      this.cancelled = true;
      if (this.abortController) {
        this.abortController.abort();
      }
    },
    handleToolboxCommand(command) {
      console.log("Received toolbox command:", command);
      if (command === 'copyChat') {
        this.copyCurrentChat();
      } else if (command === 'localScriptEditor') {
        this.showLocalScriptEditor = true;
      } else if (command === 'exportTxtNovel') {
        this.showTxtNovelExporter = false;
        this.$nextTick(() => {
          this.showTxtNovelExporter = true;
        });
      }
    },
    generateCopyTitle(originalTitle) {
      let baseTitle = originalTitle;
      while (baseTitle.endsWith(COPY_SUFFIX)) {
        baseTitle = baseTitle.slice(0, -COPY_SUFFIX.length);
      }
      if (baseTitle.length > MAX_TITLE_LENGTH - COPY_SUFFIX.length) {
        baseTitle = baseTitle.slice(0, MAX_TITLE_LENGTH - COPY_SUFFIX.length);
      }
      return baseTitle + COPY_SUFFIX;
    },
    copyCurrentChat() {
      if (!this.currentChat) return;
      const newChat = {
        id: Date.now(),
        title: this.generateCopyTitle(this.currentChat.title),
        messages: JSON.parse(JSON.stringify(this.currentChat.messages)),
        createdAt: new Date().toISOString()
      };
      this.chatHistory.unshift(newChat);
      this.currentChatId = newChat.id;
      this.saveChatHistory();
      this.$message({
        message: '对话已复制',
        type: 'success',
        duration: 2000
      });
    },
    handleEditDialogOpened() {
      // 等待DOM更新后执行滚动
      this.$nextTick(() => {
        const textarea = this.$refs.editInput.$el.querySelector('textarea');
        if (textarea) {
          textarea.scrollTop = textarea.scrollHeight;
          // 将光标定位到文本末尾
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
          textarea.focus();
        }
      });
    },
  }
}
</script>

<style src="./index.css"></style>

<style>
.reasoning-body.collapsed {
  display: none;
}

.qq-groups .el-button {
  margin-bottom: 10px;
}
.qq-groups .el-button:last-child {
  margin-bottom: 0;
}

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