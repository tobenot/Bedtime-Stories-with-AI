<template>
  <el-dialog 
    :title="dialogTitle" 
    v-model="internalVisible" 
    :width="dialogWidth"
    :fullscreen="isMobile"
    destroy-on-close
    class="script-selector-dialog"
  >
    <!-- 分类标签优化 -->
    <div class="category-tabs mb-4">
      <el-radio-group v-model="selectedCategory" size="large">
        <el-radio-button label="全部">
          <el-icon><Grid /></el-icon>
          全部
        </el-radio-button>
        <el-radio-button label="收藏">
          <el-icon><Star /></el-icon>
          收藏
        </el-radio-button>
        <el-radio-button label="最新">
          <el-icon><Timer /></el-icon>
          最新
        </el-radio-button>
        <el-radio-button label="热门">
          <el-icon><ChatDotRound /></el-icon>
          热门
        </el-radio-button>
        <el-radio-button label="基础">
          <el-icon><Collection /></el-icon>
          基础
        </el-radio-button>
        <el-radio-button label="跑团">
          <el-icon><UserFilled /></el-icon>
          跑团
        </el-radio-button>
        <el-radio-button label="男性向">
          <el-icon><Male /></el-icon>
          男性向
        </el-radio-button>
        <el-radio-button label="女性向">
          <el-icon><Female /></el-icon>
          女性向
        </el-radio-button>
      </el-radio-group>
    </div>

    <!-- 搜索框优化 -->
    <div class="search-box mb-4">
      <el-input
        v-model="searchQuery"
        placeholder="搜索剧本标题、内容或标签"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 剧本列表 -->
    <div class="script-list" v-loading="loading">
      <template v-if="filteredScripts.length">
        <el-card
          v-for="script in filteredScripts"
          :key="script.id"
          class="script-card mb-4 hover:shadow-lg transition-shadow duration-300"
          @click="selectScript(script)"
        >
          <div class="flex justify-between items-center">
            <div class="flex-grow">
              <h3 class="text-lg font-bold mb-2">{{ script.title }}</h3>
              <p class="text-sm text-gray-600 mb-3 line-clamp-2">{{ script.preview }}</p>
              <div class="flex flex-wrap gap-2">
                <el-tag
                  v-for="tag in script.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
            <div class="flex items-center ml-4">
              <el-icon class="text-gray-400 text-xl">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
          <!-- 新增收藏图标，点击时阻止事件冒泡 -->
          <div class="favorite-icon" @click.stop="toggleFavorite(script)">
            <el-icon class="text-yellow-500 text-xl">
              <template v-if="isFavorite(script)">
                <StarFilled />
              </template>
              <template v-else>
                <Star />
              </template>
            </el-icon>
          </div>
        </el-card>
      </template>
      
      <!-- 空状态 -->
      <el-empty
        v-else
        description="没有找到匹配的剧本"
        :image-size="200"
      >
        <template #description>
          <p class="text-gray-500">
            {{ searchQuery ? '没有找到匹配的剧本，请尝试其他关键词' : '暂无剧本数据' }}
          </p>
        </template>
      </el-empty>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { 
  Search, 
  ArrowRight,
  Grid,
  Timer,
  ChatDotRound,
  Collection,
  UserFilled,
  Male,
  Female,
  Star,
  StarFilled
} from '@element-plus/icons-vue'

export default {
  name: 'ScriptSelector',
  components: {
    Search,
    ArrowRight,
    Grid,
    Timer,
    ChatDotRound,
    Collection,
    UserFilled,
    Male,
    Female,
    Star,
    StarFilled
  },
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
      dialogWidth: this.isMobile ? '100%' : '80%',
      selectedCategory: '全部',
      loading: false,
      categories: ['全部', '最新', '热门', '基础', '跑团', '男性向', '女性向'],
      favorites: []
    }
  },
  computed: {
    isMobile() {
      return window.innerWidth <= 768
    },
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
        if (this.selectedCategory === '全部') {
          matchesCategory = true;
        } else if (this.selectedCategory === '收藏') {
          matchesCategory = this.favorites.includes(script.id);
        } else {
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
  mounted() {
    const storedFavorites = localStorage.getItem('scriptSelectorFavorites');
    if (storedFavorites) {
      this.favorites = JSON.parse(storedFavorites);
    }
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleResize() {
      this.dialogWidth = this.isMobile ? '100%' : '80%'
    },
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
    },
    toggleFavorite(script) {
      const index = this.favorites.indexOf(script.id);
      if (index > -1) {
        this.favorites.splice(index, 1);
      } else {
        this.favorites.push(script.id);
      }
      this.persistFavorites();
    },
    persistFavorites() {
      localStorage.setItem('scriptSelectorFavorites', JSON.stringify(this.favorites));
    },
    isFavorite(script) {
      return this.favorites.includes(script.id);
    }
  }
};
</script>

<style scoped>
/* 固定对话框位置 */
:deep(.el-dialog) {
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__body) {
  flex: 1;
  overflow: hidden;
  padding: 20px;
}

/* 移动端全屏样式 */
:deep(.el-dialog.is-fullscreen) {
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  max-height: 100vh;
  width: 100vw !important;
}

.script-list {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.script-list::-webkit-scrollbar {
  width: 6px;
}

.script-list::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.script-card {
  cursor: pointer;
  border: 1px solid #ebeef5;
  position: relative;
}

.script-card:hover {
  border-color: var(--el-color-primary);
}

.tag-item {
  border-radius: 4px;
}

.search-input :deep(.el-input__wrapper) {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.category-tabs {
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tabs :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.category-tabs :deep(.el-icon) {
  margin-right: 2px;
}

.search-input :deep(.el-input__prefix) {
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.favorite-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  z-index: 10;
}

@media (max-width: 768px) {
  .script-list {
    max-height: calc(100vh - 200px);
  }

  .category-tabs {
    margin: -10px -20px 20px;
    padding: 0 20px;
  }
}
</style>