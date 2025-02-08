<template>
    <div
      class="chat-item p-3 mb-2 rounded-lg cursor-pointer flex items-center gap-2 transition-all duration-200"
      :class="active ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-primary hover:bg-primary/10 transition-colors'"
    >
      <el-icon :class="active ? 'text-white' : 'text-secondary'"><ChatRound /></el-icon>
      <!-- 新增：标题与编辑区域 -->
      <div class="flex-1 flex items-center gap-2">
        <template v-if="!isEditing">
          <span class="chat-item-title flex-1" @click="$emit('switch', chat.id)">
            {{ chat.title || '新对话' }}
          </span>
          <el-button type="text" size="small" @click.stop="startEditing">
            <el-icon :class="active ? 'text-white' : 'text-secondary'">
              <Edit />
            </el-icon>
          </el-button>
        </template>
        <template v-else>
          <el-input
            v-model="editTitle"
            size="small"
            class="flex-1"
            @keyup.enter="saveTitle"
            @blur="saveTitle"
          />
        </template>
      </div>
      <!-- 删除按钮 -->
      <el-button 
        type="text" 
        class="opacity-60 hover:opacity-100 transition-opacity"
        @click.stop="confirmDelete"
      >
        <!-- 统一未激活时使用辅助色 -->
        <el-icon :class="active ? 'text-white' : 'text-secondary'"><Delete /></el-icon>
      </el-button>
    </div>
  </template>
<script>
import { ElMessageBox } from 'element-plus'
import { ChatRound, Delete, Edit } from '@element-plus/icons-vue'

export default {
  name: 'ChatItem',
  components: {
    ChatRound,
    Delete,
    Edit
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
      isEditing: false,
      editTitle: ''
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
    },
    startEditing() {
      this.editTitle = this.chat.title;
      this.isEditing = true;
    },
    saveTitle() {
      if (this.editTitle.trim() === '') {
        this.$message({
          message: '标题不能为空',
          type: 'warning',
          duration: 2000
        });
        this.editTitle = this.chat.title;
      } else if (this.editTitle !== this.chat.title) {
        this.$emit('update-title', { id: this.chat.id, title: this.editTitle });
      }
      this.isEditing = false;
    }
  }
}
</script> 
