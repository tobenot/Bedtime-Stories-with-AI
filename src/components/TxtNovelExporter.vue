<template>
  <el-dialog v-model="internalVisible" title="导出 txt 小说" width="400px">
    <el-form :model="options" label-width="120px">
      <el-form-item label="标题">
        <el-input v-model="options.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="作者">
        <el-input v-model="options.author" placeholder="可选填写作者" />
      </el-form-item>
      <el-form-item label="包含说话者">
        <el-switch v-model="options.includePrefix"></el-switch>
      </el-form-item>
      <el-form-item label="用户说话者" v-if="options.includePrefix">
        <el-input v-model="options.prefixUser" />
      </el-form-item>
      <el-form-item label="助手说话者" v-if="options.includePrefix">
        <el-input v-model="options.prefixAssistant" />
      </el-form-item>
      <el-form-item label="只导出 AI 的回复">
        <el-switch v-model="options.onlyAssistant"></el-switch>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="exportTxt">导出</el-button>
    </template>
  </el-dialog>
</template>

<script>
import { exportChatToTxtNovel } from '@/utils/txtExporter.js';
export default {
  name: "TxtNovelExporter",
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    chat: {
      type: Object,
      required: true,
    }
  },
  data() {
    return {
      internalVisible: this.modelValue,
      options: {
        title: '',
        author: '',
        includePrefix: false,
        prefixUser: '导演：',
        prefixAssistant: 'D老师：',
        onlyAssistant: false,
      },
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
    cancel() {
      this.internalVisible = false;
    },
    async exportTxt() {
      console.log('exportTxt triggered, chat=', this.chat, 'options=', this.options);
      const exportOptions = {
        ...this.options,
        dateTime: new Date().toLocaleString(),
      };
      try {
        const content = await exportChatToTxtNovel(this.chat, exportOptions);
        console.log('exported content:', content);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_novel_${dateStr}.txt`;
        // 这里将 a 添加到 body 可以确保点击事件能被触发
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.$message({
          message: '导出成功',
          type: 'success',
          duration: 2000,
        });
        this.internalVisible = false;
      } catch (error) {
        console.error('exportTxt error:', error);
        this.$message({
          message: '导出失败',
          type: 'error',
          duration: 2000,
        });
      }
    },
  },
};
</script> 