<template>
  <el-dialog 
    v-model="internalVisible" 
    title="导出 txt 小说" 
    :width="dialogWidth"
    :style="{ maxWidth: '800px' }"
    class="txt-novel-exporter"
  >
    <el-tabs v-model="activeTab">
      <!-- 基本信息设置 -->
      <el-tab-pane label="基本信息" name="basic">
        <el-form :model="options" label-width="80px">
          <el-card class="mb-4">
            <template #header>
              <div class="card-header">
                <span>小说信息</span>
                <el-tooltip content="这些信息将显示在导出文件的开头" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-form-item label="标题">
              <el-input v-model="options.title" placeholder="请输入标题" />
            </el-form-item>
            <el-form-item label="作者">
              <el-input v-model="options.author" placeholder="可选填写作者" />
            </el-form-item>
            <el-form-item label="简介">
              <el-input 
                type="textarea" 
                v-model="options.description" 
                placeholder="请输入简介"
                :autosize="{ minRows: 3, maxRows: 8 }" 
              />
            </el-form-item>
          </el-card>
        </el-form>
      </el-tab-pane>

      <!-- 导出选项设置 -->
      <el-tab-pane label="导出选项" name="options">
        <el-form :model="options" label-width="120px">
          <el-card class="mb-4">
            <template #header>
              <div class="card-header">
                <span>格式选项</span>
                <el-tooltip content="设置导出文本的格式" placement="top">
                  <el-icon><Setting /></el-icon>
                </el-tooltip>
              </div>
            </template>
            
            <div class="option-item">
            <span class="option-label">
                去除 Markdown
                <el-tooltip content="移除文本中的Markdown格式符号" placement="top">
                <el-icon class="icon-small"><QuestionFilled /></el-icon>
                </el-tooltip>
            </span>
            <el-switch v-model="options.stripMarkdown" />
            </div>
            
            <!-- 新增：保留列表选项 -->
            <div v-if="options.stripMarkdown" class="option-item">
              <span class="option-label">
                保留列表格式
                <el-tooltip content="保留无序列表(-) 和有序列表(1.) 的格式" placement="top">
                  <el-icon class="icon-small"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
              <el-switch v-model="options.preserveLists" />
            </div>
            
            <div class="option-item">
            <span class="option-label">
                只导出AI回复
                <el-tooltip content="仅导出AI的回复内容，不包含用户输入" placement="top">
                <el-icon class="icon-small"><QuestionFilled /></el-icon>
                </el-tooltip>
            </span>
            <el-switch v-model="options.onlyAssistant" />
            </div>
          </el-card>
          <el-card>
            <template #header>
              <div class="card-header">
                <span>对话标记</span>
                <el-tooltip content="设置对话中说话者的显示方式" placement="top">
                  <el-icon><ChatDotRound /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-form-item>
              <template #label>
                <span class="flex items-center">
                  包含说话者
                  <el-tooltip content="在每段对话前添加说话者标记" placement="top">
                    <el-icon class="ml-1"><QuestionFilled /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-switch v-model="options.includePrefix" />
            </el-form-item>

            <template v-if="options.includePrefix">
              <el-form-item label="用户说话者">
                <el-input v-model="options.prefixUser" placeholder="例如：导演：" />
              </el-form-item>
              <el-form-item label="助手说话者">
                <el-input v-model="options.prefixAssistant" placeholder="例如：D老师：" />
              </el-form-item>
            </template>
          </el-card>
        </el-form>
      </el-tab-pane>

      <!-- 预览面板 -->
      <el-tab-pane label="预览" name="preview">
        <el-card class="preview-card">
          <div class="preview-content">
            <div v-if="previewLoading" class="preview-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              正在生成预览...
            </div>
            <pre v-else class="preview-text">{{ previewContent }}</pre>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="saveAsDefault">
          保存为默认配置
        </el-button>
        <el-button type="primary" @click="exportTxt" :loading="exporting">
          导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, watch } from 'vue';
import { exportChatToTxtNovel } from '@/utils/txtExporter.js';
import { 
  InfoFilled, 
  Setting, 
  QuestionFilled, 
  ChatDotRound,
  Loading
} from '@element-plus/icons-vue';

const DEFAULT_OPTIONS_KEY = 'txt_exporter_default_options';

export default {
  name: "TxtNovelExporter",
  components: {
    InfoFilled,
    Setting,
    QuestionFilled,
    ChatDotRound,
    Loading
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    chat: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      internalVisible: this.modelValue,
      activeTab: 'basic',
      options: this.getDefaultOptions(),
      previewContent: '',
      previewLoading: false,
      exporting: false,
    }
  },
  watch: {
    modelValue(newVal) {
      this.internalVisible = newVal;
    },
    internalVisible(newVal) {
      this.$emit('update:modelValue', newVal);
    },
    activeTab(newVal) {
      if (newVal === 'preview') {
        this.generatePreview();
      }
    },
    options: {
      deep: true,
      handler() {
        if (this.activeTab === 'preview') {
          this.generatePreview();
        }
      }
    }
  },
  methods: {
    getDefaultOptions() {
      const savedOptions = localStorage.getItem(DEFAULT_OPTIONS_KEY);
      const defaultOptions = {
        title: '',
        author: '',
        description: '',
        stripMarkdown: true,
        includePrefix: false,
        prefixUser: '导演：',
        prefixAssistant: 'D老师：',
        onlyAssistant: false,
        preserveLists: true,
      };
      
      return savedOptions ? { ...defaultOptions, ...JSON.parse(savedOptions) } : defaultOptions;
    },
    
    async generatePreview() {
      this.previewLoading = true;
      try {
        const content = await exportChatToTxtNovel(this.chat, {
          ...this.options,
          dateTime: new Date().toLocaleString(),
        });
        this.previewContent = content;
      } catch (error) {
        console.error('预览生成失败:', error);
        this.$message.error('预览生成失败');
      } finally {
        this.previewLoading = false;
      }
    },

    saveAsDefault() {
      localStorage.setItem(DEFAULT_OPTIONS_KEY, JSON.stringify(this.options));
      this.$message({
        message: '已保存为默认配置',
        type: 'success'
      });
    },

    cancel() {
      this.internalVisible = false;
    },

    async exportTxt() {
      this.exporting = true;
      try {
        const content = await exportChatToTxtNovel(this.chat, {
          ...this.options,
          dateTime: new Date().toLocaleString(),
        });
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.options.title || 'chat_novel'}_${dateStr}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.$message({
          message: '导出成功',
          type: 'success',
        });
        this.internalVisible = false;
      } catch (error) {
        console.error('导出失败:', error);
        this.$message({
          message: '导出失败',
          type: 'error',
        });
      } finally {
        this.exporting = false;
      }
    },
  },
  computed: {
    dialogWidth() {
      if (window.innerWidth < 768) {
        return '95%'
      } else if (window.innerWidth < 1200) {
        return '600px'
      } else {
        return '800px'
      }
    }
  },
};
</script>

<style scoped>
.txt-novel-exporter :deep(.el-dialog__body) {
  padding: 0 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.preview-card {
  min-height: 300px;
  max-height: 500px;
  overflow: hidden;
}

.preview-content {
  height: 100%;
  overflow-y: scroll;
  max-height: 768px;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 300px;
  color: #909399;
}

.preview-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  padding: 12px;
  margin: 0;
  background: #f8f9fa;
  border-radius: 4px;
  height: 100%;
  overflow-y: auto;
}

.ml-1 {
  margin-left: 4px;
}

.dialog-footer {
  padding: 20px 0;
  text-align: right;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 4px 0;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  white-space: nowrap;
}

.icon-small {
  font-size: 14px;
}

@media screen and (max-width: 768px) {
  .txt-novel-exporter :deep(.el-dialog__body) {
    padding: 0 10px;
  }
  
  .txt-novel-exporter :deep(.el-form-item) {
    margin-bottom: 12px;
  }
  
  .txt-novel-exporter :deep(.el-form-item__label) {
    padding-right: 6px;
    font-size: 14px;
  }
  
  .txt-novel-exporter :deep(.el-tabs__header) {
    margin-bottom: 10px;
  }
  
  .preview-card {
    min-height: 200px;
    max-height: 300px;
  }
  
  .preview-content {
    max-height: 260px;
  }
  
  .dialog-footer {
    padding: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .dialog-footer .el-button {
    width: 100%;
    margin-left: 0 !important;
  }
  
  .option-row {
    gap: 12px;
  }
  
  .option-item {
    min-width: 120px;
  }
  
  .option-label {
    font-size: 13px;
  }
}

.preview-text::-webkit-scrollbar {
  width: 8px;
}

.preview-text::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.preview-text::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.preview-text::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style> 