<template>
  <el-dialog :title="dialogTitle" v-model="internalVisible" :width="dialogWidth">
    <el-tabs v-model="selectedCategory" type="border-card" class="mb-4">
      <el-tab-pane label="全部" name="全部"></el-tab-pane>
      <el-tab-pane label="最新" name="最新"></el-tab-pane>
      <el-tab-pane label="热门" name="热门"></el-tab-pane>
      <el-tab-pane label="基础" name="基础"></el-tab-pane>
      <el-tab-pane label="跑团" name="跑团"></el-tab-pane>
      <el-tab-pane label="男性向" name="男性向"></el-tab-pane>
      <el-tab-pane label="女性向" name="女性向"></el-tab-pane>
    </el-tabs>
    <div class="mb-4">
      <el-input v-model="searchQuery" placeholder="搜索剧本或标签" clearable>
        <template slot="prefix">
          <i class="el-icon-search"></i>
        </template>
      </el-input>
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
      dialogWidth: window.innerWidth < 768 ? '90%' : '80%',
      selectedCategory: '基础'
    }
  },
  computed: {
    filteredScripts() {
      const query = this.searchQuery.toLowerCase();
      let filtered = this.scripts.filter(script => {
        // 搜索条件
        const matchesSearch =
          !this.searchQuery ||
          script.title.toLowerCase().includes(query) ||
          script.preview.toLowerCase().includes(query) ||
          (script.tags &&
            script.tags.some(tag => tag.toLowerCase().includes(query)));
        // 分类过滤：除了 "全部"，均按 tags 判断
        let matchesCategory = true;
        if (this.selectedCategory !== '全部') {
          matchesCategory =
            script.tags && script.tags.includes(this.selectedCategory);
        }
        return matchesSearch && matchesCategory;
      });
      return filtered;
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

.el-tabs__header {
  border-bottom: none;
}

.dialog-footer {
  position: sticky;
  bottom: 0;
  background-color: #fff;
  padding: 10px;
  /* 可选：添加上边框，分隔视觉效果 */
  border-top: 1px solid #ebeef5;
  z-index: 100;
}
</style>