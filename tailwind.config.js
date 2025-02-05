/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A5F',
          light: '#2C5693',
        },
        secondary: {
          DEFAULT: '#4A90E2',
          light: '#6BA4E9',
        },
        accent: {
          purple: '#9B59B6',
          silver: '#BDC3C7',
        },
        highlight: '#F1C40F',
        customGray: '#666666',       // 用于替代 inline 的 #666
        reasoningBg: '#f5f5f5',      // 用于 reasoning 背景
        // 可根据需要添加更多自定义颜色
      },
      opacity: {
        '5': '0.05',
        '10': '0.1',
        '20': '0.2',
        '30': '0.3',
        '40': '0.4',
        '60': '0.6',
        '80': '0.8',
        '90': '0.9',
        '95': '0.95',
      },
    },
  },
  plugins: [
    require('tailwindcss-scrollbar'),
  ],
} 