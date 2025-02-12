<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="80%"
    :close-on-click-modal="false"
    class="global-dialog wildcards-dialog"
    :style="dialogStyle"
    @close="handleCancel"
  >
    <div class="wildcards-container">
      <div class="tips">
        <div class="tips-title">填写说明：</div>
        <div class="tips-content">
          1. 请根据剧本内容和风格，填写以下空缺内容<br>
          2. 您可以选择预设选项，或输入自定义内容<br>
          3. 所有项目都必须填写才能继续
        </div>
      </div>
      
      <div v-for="(wc, index) in wildcards" 
           :key="index" 
           class="wildcard-item">
        <div class="prompt">
          <span class="index">{{ index + 1 }}.</span>
          <span class="prompt-text">{{ wc.prompt }}</span>
        </div>
        
        <div class="preset-options" v-if="wc.options.length > 0">
          <el-tag
            v-for="option in wc.options"
            :key="option"
            @click="selections[index] = option"
            :effect="selections[index] === option ? 'dark' : 'plain'"
          >
            {{ option }}
          </el-tag>
          <el-tag 
            class="custom-option"
            @click="selections[index] = ''"
            :effect="selections[index] === '' ? 'dark' : 'plain'"
          >
            自定义
          </el-tag>
        </div>

        <el-input
          v-model="selections[index]"
          :placeholder="wc.options.length ? '选择预设或输入自定义内容' : '请输入内容'"
        >
          <template #append v-if="selections[index]">
            <el-button @click="selections[index] = ''">
              <el-icon><Close /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <span class="error-tip" v-if="hasEmptyFields">
          <el-icon><Warning /></el-icon> 请填写所有必填项
        </span>
        <div class="buttons">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm" :disabled="hasEmptyFields">
            确认选择
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, computed } from 'vue';
import { ElDialog, ElButton, ElInput, ElTag, ElIcon } from 'element-plus';
import { Close, Warning } from '@element-plus/icons-vue';

export default {
  name: 'PromptWildcards',
  components: {
    ElDialog,
    ElButton,
    ElInput,
    ElTag,
    ElIcon,
    Close,
    Warning
  },
  props: {
    wildcards: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const visible = ref(true);
    const selections = reactive({});
    const dialogTitle = computed(() => {
      return `填写剧本内容 (共 ${props.wildcards.length} 项)`;
    });
    
    // 初始化默认值
    props.wildcards.forEach((wc, index) => {
      selections[index] = wc.defaultValue;
    });

    // 检查是否有空字段
    const hasEmptyFields = computed(() => {
      return Object.values(selections).some(value => !value || value.trim() === '');
    });

    const handleConfirm = () => {
      if (hasEmptyFields.value) {
        return;
      }
      visible.value = false;
      emit('confirm', { ...selections });
    };

    const handleCancel = () => {
      visible.value = false;
      emit('cancel');
    };

    const dialogStyle = {
      '--el-dialog-width': '80%',
      '--el-dialog-max-width': '701px',
      '--el-dialog-margin-top': '5vh'
    };

    return {
      visible,
      selections,
      hasEmptyFields,
      dialogTitle,
      handleConfirm,
      handleCancel,
      dialogStyle
    };
  }
};
</script>

<style scoped>
:deep(.el-dialog) {
  max-width: var(--el-dialog-max-width);
  margin: var(--el-dialog-margin-top) auto 0;
}

.wildcards-container {
  max-height: 80vh;
  overflow-y: auto;
  padding: 0 10px;
}

.tips {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.tips-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.tips-content {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.wildcard-item {
  margin-bottom: 24px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.prompt {
  margin-bottom: 12px;
}

.index {
  color: var(--el-color-primary);
  font-weight: bold;
  margin-right: 8px;
}

.prompt-text {
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.preset-options {
  margin-bottom: 12px;
}

.el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-tip {
  color: var(--el-color-danger);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.buttons {
  display: flex;
  gap: 12px;
}

@media screen and (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 3vh auto 0;
  }
  
  .wildcards-container {
    padding: 0 5px;
  }
  
  .wildcard-item {
    padding: 12px;
  }
}
</style> 