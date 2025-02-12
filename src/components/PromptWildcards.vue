<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="60%"
    @close="handleCancel"
    :close-on-click-modal="false"
  >
    <div class="wildcards-container" style="max-height: 60vh; overflow-y: auto; padding: 0 10px;">
      <!-- 添加说明文字 -->
      <div class="tips" style="margin-bottom: 20px; padding: 12px; background: #f5f7fa; border-radius: 4px;">
        <div style="font-weight: bold; margin-bottom: 8px;">填写说明：</div>
        <div style="color: #666; font-size: 14px; line-height: 1.6;">
          1. 请根据剧本内容和风格，填写以下空缺内容<br>
          2. 您可以选择预设选项，或输入自定义内容<br>
          3. 所有项目都必须填写才能继续
        </div>
      </div>
      
      <div v-for="(wc, index) in wildcards" 
           :key="index" 
           class="wildcard-item"
           style="margin-bottom: 24px; padding: 16px; border-radius: 8px; background: #f8f9fa;">
        <div class="prompt" style="margin-bottom: 8px;">
          <span class="index" style="color: #409eff; font-weight: bold; margin-right: 8px;">{{ index + 1 }}.</span>
          <span class="prompt-text" style="font-weight: bold; color: #303133;">{{ wc.prompt }}</span>
        </div>
        
        <!-- 预设选项展示 -->
        <div class="preset-options" style="margin-bottom: 10px;" v-if="wc.options.length > 0">
          <el-tag
            v-for="option in wc.options"
            :key="option"
            style="margin-right: 8px; margin-bottom: 8px; cursor: pointer;"
            @click="selections[index] = option"
            :effect="selections[index] === option ? 'dark' : 'plain'"
          >
            {{ option }}
          </el-tag>
        </div>

        <el-input
          v-model="selections[index]"
          :placeholder="wc.options.length ? '选择预设或输入自定义内容' : '请输入内容'"
          style="width: 100%;"
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
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f56c6c; font-size: 14px;" v-if="hasEmptyFields">
          <el-icon><Warning /></el-icon> 请填写所有必填项
        </span>
        <div>
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

    return {
      visible,
      selections,
      hasEmptyFields,
      dialogTitle,
      handleConfirm,
      handleCancel
    };
  }
};
</script>

<style>
.el-tag {
  transition: all 0.3s;
}
.el-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style> 