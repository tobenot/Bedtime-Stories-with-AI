<template>
  <el-dialog 
    :title="dialogTitle" 
    v-model="internalVisible" 
    :width="dialogWidth"
    class="script-editor-dialog"
  >
    <!-- 工具条：新建、导出、导入 -->
    <div class="toolbar flex flex-wrap items-center gap-2 mb-4">
      <el-button type="primary" class="toolbar-btn" @click="openNewScriptForm">
        <el-icon class="mr-1"><Plus /></el-icon>新建剧本
      </el-button>
      <el-button class="toolbar-btn" @click="exportScripts">
        <el-icon class="mr-1"><Download /></el-icon>导出剧本
      </el-button>
      <el-dropdown trigger="click" class="toolbar-btn">
        <el-button>
          <el-icon class="mr-1"><Upload /></el-icon>导入剧本
          <el-icon class="ml-1"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="importScripts('merge')">
              <el-icon><Plus /></el-icon>导入（合并）
            </el-dropdown-item>
            <el-dropdown-item @click="importScripts('overwrite')">
              <el-icon><Switch /></el-icon>导入（覆盖）
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- 隐藏文件上传控件 -->
      <input type="file" ref="importFile" style="display: none;" accept=".json" @change="handleImportFile" />
    </div>
    <!-- 剧本列表 -->
    <div class="script-list">
      <div v-if="!localScripts.length" class="empty-state text-center py-8">
        <el-icon class="text-4xl text-gray-400 mb-4"><Document /></el-icon>
        <p class="text-gray-500">还没有本地剧本，快来创建一个吧！</p>
        <p class="text-gray-500">它们只保存在浏览器中，不会公开！</p>
      </div>
      <el-card
        v-for="script in localScripts"
        :key="script.id"
        class="mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-300"
        @click="previewScript(script)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-bold">{{ script.title }}</h3>
            <p class="text-sm text-customGray">{{ script.preview }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <el-tag 
                v-for="tag in script.tags" 
                :key="tag" 
                size="small" 
                class="mr-1"
              >{{ tag }}</el-tag>
            </div>
          </div>
          <div class="actions flex gap-2 ml-4">
            <el-button 
              type="primary" 
              size="small" 
              plain
              @click.stop="editScript(script)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              plain
              @click.stop="deleteScript(script.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取消</el-button>
    </span>
  </el-dialog>

  <!-- 剧本编辑对话框 -->
  <el-dialog 
    :title="editDialogTitle" 
    v-model="editDialogVisible"
    :width="dialogWidth"
    class="script-edit-dialog"
    append-to-body
  >
    <el-form :model="editScriptData" label-width="80px">
      <el-form-item label="标题">
        <el-input v-model="editScriptData.title"></el-input>
      </el-form-item>
      <el-form-item label="剧本预览">
        <el-input 
          v-model="editScriptData.preview"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 3 }"
          placeholder="简短描述剧本内容..."
        ></el-input>
      </el-form-item>
      <el-form-item label="内容">
        <el-input 
          type="textarea" 
          :autosize="{ minRows: 5, maxRows: 15 }" 
          v-model="editScriptData.content"
          placeholder="在这里输入完整的剧本内容..."
        ></el-input>
      </el-form-item>
      <el-form-item label="标签">
        <el-input 
          v-model="editScriptData.tags" 
          placeholder="多个标签请用逗号隔开，如：奇幻,冒险,恋爱"
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveScript">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { Plus, Download, Upload, ArrowDown, Document, Edit, Delete, Switch } from '@element-plus/icons-vue'

export default {
  name: 'LocalScriptEditor',
  components: {
    Plus,
    Download,
    Upload,
    ArrowDown,
    Document,
    Edit,
    Delete,
    Switch
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    dialogTitle: {
      type: String,
      default: '本地剧本编辑器'
    }
  },
  data() {
    return {
      internalVisible: this.modelValue,
      localScripts: [],
      editDialogVisible: false,
      editScriptData: {
        id: null,
        title: '',
        preview: '',
        content: '',
        tags: '' // 打开编辑框时将以逗号分隔的字符串形式处理
      },
      importMode: null
    }
  },
  computed: {
    editDialogTitle() {
      return this.editScriptData.id ? '编辑剧本' : '新建剧本';
    },
    dialogWidth() {
      return window.innerWidth < 768 ? '100%' : '80%';
    }
  },
  watch: {
    modelValue(newVal) {
      this.internalVisible = newVal;
      if (newVal) {
        this.loadScripts();
      }
    },
    internalVisible(newVal) {
      this.$emit('update:modelValue', newVal);
    }
  },
  methods: {
    loadScripts() {
      const data = localStorage.getItem('local_scripts');
      this.localScripts = data ? JSON.parse(data) : [];
    },
    saveScripts() {
      localStorage.setItem('local_scripts', JSON.stringify(this.localScripts));
    },
    openNewScriptForm() {
      this.editScriptData = {
        id: Date.now(),
        title: '',
        preview: '',
        content: '',
        tags: ''
      };
      this.editDialogVisible = true;
    },
    editScript(script) {
      // 克隆并将 tags 数组转为逗号分隔字符串
      this.editScriptData = {
        ...script,
        tags: script.tags ? script.tags.join(',') : ''
      };
      this.editDialogVisible = true;
    },
    cancelEdit() {
      this.editDialogVisible = false;
    },
    saveScript() {
      // 将逗号分隔字符串转换为数组
      const tagsArr = this.editScriptData.tags.split(',')
        .map(t => t.trim())
        .filter(t => t);
      const scriptData = {
        id: this.editScriptData.id,
        title: this.editScriptData.title,
        preview: this.editScriptData.preview,
        content: this.editScriptData.content,
        tags: tagsArr
      };
      const index = this.localScripts.findIndex(s => s.id === scriptData.id);
      if (index >= 0) {
        this.localScripts.splice(index, 1, scriptData);
      } else {
        this.localScripts.push(scriptData);
      }
      this.saveScripts();
      this.editDialogVisible = false;
      this.$message({
        message: '剧本已保存',
        type: 'success'
      });
    },
    deleteScript(id) {
      this.$confirm('确认删除此剧本?', '删除确认', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.localScripts.findIndex(s => s.id === id);
        if (index >= 0) {
          this.localScripts.splice(index, 1);
          this.saveScripts();
          this.$message({
            message: '剧本已删除',
            type: 'success'
          });
        }
      }).catch(() => {});
    },
    previewScript(script) {
      // 显示剧本详情预览，确认是否使用该剧本
      let message = script.content;
      if (script.tags && script.tags.length) {
        message += `<br/><span>标签：${script.tags.join(', ')}</span>`;
      }
      this.$confirm(message, `剧本预览 - ${script.title}`, {
        confirmButtonText: '使用该剧本',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        customClass: 'confirm-script-preview'
      }).then(() => {
        this.$emit('script-selected', script);
        this.internalVisible = false;
      }).catch(() => {});
    },
    exportScripts() {
      const dataStr = JSON.stringify(this.localScripts, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `local_scripts_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.$message({
        message: '剧本已导出',
        type: 'success'
      });
    },
    importScripts(mode) {
      this.importMode = mode; // 'overwrite' 或 'merge'
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
            throw new Error('导入文件格式错误，应该为剧本数组');
          }
        } catch (err) {
          this.$message({
            message: '无法解析文件，请确认文件格式正确。',
            type: 'error'
          });
          return;
        }
        if (this.importMode === 'overwrite') {
          this.localScripts = importedData;
        } else if (this.importMode === 'merge') {
          this.localScripts = importedData.concat(this.localScripts);
        }
        this.saveScripts();
        this.$message({
          message: '剧本导入成功',
          type: 'success'
        });
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    closeDialog() {
      this.internalVisible = false;
    }
  }
};
</script>

<style scoped>
.script-list {
  max-height: 60vh;
  overflow-y: auto;
  padding: 0.5rem;
}

/* 自定义滚动条样式 */
.script-list::-webkit-scrollbar {
  width: 6px;
}

.script-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.script-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.script-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 对话框自定义样式 */
:deep(.el-dialog__body) {
  padding: 1rem;
}

@media (max-width: 768px) {
  .toolbar {
    justify-content: space-between;
  }
  
  .el-button {
    padding: 8px 12px;
  }
  
  :deep(.el-dialog__body) {
    padding: 0.5rem;
  }
}

/* 添加工具栏按钮样式 */
.toolbar {
  display: flex;
  align-items: center;
}

.toolbar-btn {
  margin: 0 !important;
}

.toolbar :deep(.el-dropdown) {
  margin: 0;
}

.toolbar :deep(.el-button) {
  margin: 0;
}
</style>
