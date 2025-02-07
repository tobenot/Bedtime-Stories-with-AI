<template>
  <el-dialog :title="dialogTitle" v-model="internalVisible" :width="dialogWidth">
    <div class="mb-4">
      <el-input
        v-model="searchQuery"
        placeholder="搜索剧本或标签"
        clearable
      />
    </div>
    <div class="script-list">
      <el-card
        v-for="script in filteredScripts"
        :key="script.id"
        class="mb-4 cursor-pointer"
        @click="selectScript(script)"
      >
        <div class="mb-2">
          <h3 class="text-lg font-bold">{{ script.title }}</h3>
          <p class="text-sm text-customGray">{{ script.preview }}</p>
        </div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in script.tags"
            :key="tag"
            class="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded"
          >
            {{ tag }}
          </span>
        </div>
      </el-card>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ScriptSelector',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    scripts: {
      type: Array,
      default: () => []
    },
    dialogTitle: {
      type: String,
      default: '选择剧本'
    }
  },
  data() {
    return {
      searchQuery: '',
      internalVisible: this.modelValue,
      dialogWidth: window.innerWidth < 768 ? '90%' : '50%'
    }
  },
  computed: {
    filteredScripts() {
      if (!this.searchQuery) return this.scripts;
      const query = this.searchQuery.toLowerCase();
      return this.scripts.filter(script => {
        return (
          script.title.toLowerCase().includes(query) ||
          script.preview.toLowerCase().includes(query) ||
          (script.tags &&
            script.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      });
    }
  },
  watch: {
    modelValue(newVal) {
      this.internalVisible = newVal;
    },
    internalVisible(newVal) {
      console.log('[ScriptSelector] internalVisible changed:', newVal);
      this.$emit('update:modelValue', newVal);
    }
  },
  methods: {
    selectScript(script) {
      // 构造消息内容，追加作者链接及作者名称（如果存在）
      let message = script.content;
      if (script.authorLink && script.authorName) {
        message += `<br/><a href="${script.authorLink}" target="_blank" rel="noopener" style="color: blue; text-decoration: underline;">作者：${script.authorName}</a>`;
      } else if (script.authorLink) {
        message += `<br/><a href="${script.authorLink}" target="_blank" rel="noopener" style="color: blue; text-decoration: underline;">作者链接</a>`;
      }
      this.$confirm(message, '剧本预览', {
        confirmButtonText: '确认使用该剧本',
        cancelButtonText: '取消',
        type: '', // 移除图标类型
        customClass: 'confirm-script-preview',
        dangerouslyUseHTMLString: true // 允许 HTML 字符串显示
      }).then(() => {
        console.log('[ScriptSelector] script confirmed:', script);
        this.$emit('script-selected', script);
        this.internalVisible = false;
        this.searchQuery = '';
      }).catch(() => {
        console.log('[ScriptSelector] script selection cancelled');
      });
    },
    closeDialog() {
      console.log('[ScriptSelector] close dialog triggered');
      this.internalVisible = false;
      this.searchQuery = '';
    }
  }
};
</script>

<style scoped>
.script-list {
  max-height: 70vh; /* 高度可根据需要调整 */
  overflow-y: auto;
}
</style>