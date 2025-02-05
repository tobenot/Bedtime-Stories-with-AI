/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',
        secondary: '#4A90E2',
        accentPurple: '#9B59B6',
        accentSilver: '#BDC3C7',
        highlightYellow: '#F1C40F',
        customGray: '#666666',       // 新增，用于替代 inline 的 #666
        reasoningBg: '#f5f5f5',       // 新增，用于 reasoning 背景
        // 可根据需要添加更多自定义颜色
      },
    },
  },
  plugins: [],
} 