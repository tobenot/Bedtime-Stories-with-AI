<template>
  <el-dialog
    :model-value="visible"
    title="请填写以下内容"
    width="50%"
    @close="handleCancel"
    :close-on-click-modal="false"
  >
    <!-- 内容区域设置最大高度并启用垂直滚动 -->
    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
      <div v-for="(wc, index) in wildcards" :key="index" style="margin-bottom: 20px;">
        <div style="margin-bottom: 5px; font-weight: bold;">{{ wc.prompt }}</div>
        <el-select
          v-model="selections[index]"
          filterable
          allow-create
          placeholder="请选择或输入"
          style="width: 100%;"
        >
          <el-option
            v-for="(option, i) in wc.options"
            :key="i"
            :label="option"
            :value="option"
          />
        </el-select>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive } from 'vue';
import { ElDialog, ElSelect, ElOption, ElButton, ElMessage } from 'element-plus';

export default {
  name: 'PromptWildcards',
  components: {
    ElDialog,
    ElSelect,
    ElOption,
    ElButton
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
    // 为每个通配符初始化默认值
    props.wildcards.forEach((wc, index) => {
      selections[index] = wc.defaultValue;
    });

    const handleConfirm = () => {
      // 检查所有输入项不能为空
      for (let index in selections) {
        if (!selections[index] || selections[index].trim() === '') {
          ElMessage.error('请填写完整，输入不能为空');
          return;
        }
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
      handleConfirm,
      handleCancel
    };
  }
};
</script> 