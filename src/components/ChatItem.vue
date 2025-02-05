<template>
  <div
    class="chat-item p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-2 transition-all duration-200"
    :class="active ? 'bg-primary text-white shadow-md' : 'bg-white text-primary hover:bg-primary/5 transition-colors'"
  >
    <el-icon :class="active ? 'text-white' : 'text-secondary'"><ChatRound /></el-icon>
    <!-- 点击标题切换对话 -->
    <span class="chat-item-title flex-1" @click="$emit('switch', chat.id)">
      {{ chat.title || '新对话' }}
    </span>
    <!-- 删除按钮 -->
    <el-button 
      type="text" 
      class="opacity-60 hover:opacity-100 transition-opacity"
      @click.stop="confirmDelete"
    >
      <el-icon :class="active ? 'text-white' : 'text-primary'"><Delete /></el-icon>
    </el-button>
  </div>
</template>

<script>
import { ElMessageBox } from 'element-plus'
import { ChatRound, Delete } from '@element-plus/icons-vue'

export default {
  name: 'ChatItem',
  components: {
    ChatRound,
    Delete
  },
  props: {
    chat: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // 删除了与重命名功能相关的状态
    }
  },
  watch: {
    // 删除了与重命名功能相关的watch
  },
  methods: {
    confirmDelete() {
      console.log('confirmDelete called for chat id =', this.chat.id)
      this.$confirm('确定删除该对话吗？', '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          console.log('User confirmed delete')
          this.$emit('delete', this.chat.id)
        })
        .catch(() => {
          console.log('User canceled delete')
          // 用户取消删除，不做处理
        })
    }
  }
}
</script> 