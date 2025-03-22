<template>
  <el-dialog 
    v-model="internalVisible" 
    title="Markdown格式处理工具" 
    :width="dialogWidth"
    :style="{ maxWidth: '800px' }"
    class="markdown-tool"
  >
    <div class="tool-container">
      <div class="content-wrapper">
        <div class="input-section">
          <el-form>
            <el-form-item label="输入文本">
              <el-input 
                type="textarea" 
                v-model="inputText" 
                :autosize="{ minRows: 8, maxRows: 15 }" 
                placeholder="在此粘贴需要处理的Markdown文本..."
              ></el-input>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="processText" class="process-btn">处理文本</el-button>
        </div>
        
        <div class="options-section">
          <h3 class="options-title">处理选项</h3>
          <div class="options-list">
            <el-checkbox v-model="options.keepLists">保留列表 (- 和 1. 格式)</el-checkbox>
            <el-checkbox v-model="options.stripBold">去除加粗 (**文本**)</el-checkbox>
            <el-checkbox v-model="options.stripItalic">去除斜体 (*文本*)</el-checkbox>
            <el-checkbox v-model="options.stripHeadings">去除标题 (# 标题)</el-checkbox>
            <el-checkbox v-model="options.stripLinks">去除链接 ([文本](链接))</el-checkbox>
            <el-checkbox v-model="options.stripCode">去除代码 (`代码`)</el-checkbox>
            <el-checkbox v-model="options.stripStrikethrough">去除删除线 (~~文本~~)</el-checkbox>
          </div>
        </div>
        
        <div class="output-section">
          <el-form>
            <el-form-item label="处理结果">
              <el-input 
                type="textarea" 
                v-model="outputText" 
                :autosize="{ minRows: 8, maxRows: 15 }" 
                readonly
                placeholder="处理后的文本将显示在这里..."
              ></el-input>
            </el-form-item>
          </el-form>
          <el-button type="success" @click="copyProcessedText" :disabled="!outputText">复制结果</el-button>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: "MarkdownTool",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    return {
      internalVisible: this.modelValue,
      inputText: '',
      outputText: '',
      options: {
        keepLists: true,
        stripBold: true,
        stripItalic: true,
        stripHeadings: true,
        stripLinks: true,
        stripCode: true,
        stripStrikethrough: true
      },
      originalText: '',
    }
  },
  computed: {
    dialogWidth() {
      return window.innerWidth < 768 ? '95%' : '80%';
    }
  },
  watch: {
    modelValue(newVal) {
      this.internalVisible = newVal;
    },
    internalVisible(newVal) {
      this.$emit('update:modelValue', newVal);
    }
  },
  methods: {
    processText() {
      if (!this.inputText) return;
      
      // 保存原始文本用于恢复
      if (!this.originalText) {
        this.originalText = this.inputText;
      }
      
      let processedText = this.inputText;
      
      // 应用选择的转换
      if (this.options.stripBold) {
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '$1');
      }
      
      if (this.options.stripItalic) {
        processedText = processedText.replace(/\*(.*?)\*/g, '$1');
        processedText = processedText.replace(/_(.*?)_/g, '$1');
      }
      
      if (this.options.stripHeadings) {
        processedText = processedText.replace(/^#{1,6}\s+/gm, '');
      }
      
      if (this.options.stripLinks) {
        processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '$1');
      }
      
      if (this.options.stripCode) {
        processedText = processedText.replace(/`([^`]+)`/g, '$1');
        // 移除代码块但保留内容
        processedText = processedText.replace(/```[\s\S]*?```/g, (match) => {
          return match.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '$1');
        });
      }
      
      if (this.options.stripStrikethrough) {
        processedText = processedText.replace(/~~(.*?)~~/g, '$1');
      }
      
      // 如果不保留列表格式，则移除列表标记
      if (!this.options.keepLists) {
        // 移除无序列表标记
        processedText = processedText.replace(/^[\s]*[-*+][\s]+/gm, '');
        // 移除有序列表标记
        processedText = processedText.replace(/^[\s]*\d+\.[\s]+/gm, '');
      }
      
      this.outputText = processedText;
      
      // 自动复制处理结果
      this.copyProcessedText();
    },
    
    copyProcessedText() {
      if (!this.outputText) return;
      
      navigator.clipboard.writeText(this.outputText)
        .then(() => {
          this.$message({
            message: '已复制到剪贴板',
            type: 'success',
            duration: 2000
          });
        })
        .catch(err => {
          console.error('复制失败:', err);
          this.$message({
            message: '复制失败，请手动复制',
            type: 'error',
            duration: 2000
          });
        });
    },
    
    cancel() {
      this.internalVisible = false;
      this.inputText = '';
      this.outputText = '';
      this.originalText = '';
    }
  }
}
</script>

<style scoped>
.tool-container {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 200px 1fr;
  gap: 20px;
  align-items: start;
}

.input-section, .output-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.options-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  border-left: 1px solid #eee;
  border-right: 1px solid #eee;
  padding: 0 15px;
}

.options-title {
  text-align: center;
  margin-bottom: 15px;
  font-weight: bold;
  color: #606266;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.process-btn, .output-section button {
  align-self: flex-end;
  margin-top: 8px;
}

@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .options-section {
    border-left: none;
    border-right: none;
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    padding: 15px 0;
    margin: 15px 0;
  }
  
  .options-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}
</style> 