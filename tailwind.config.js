/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A5568', // 深蓝灰色,更适合夜间阅读
          light: '#718096',   // 较浅的蓝灰色
          dark: '#2D3748',    // 深色调
        },
        secondary: {
          DEFAULT: '#805AD5', // 梦幻紫色
          light: '#B794F4',   // 浅紫色
          dark: '#553C9A',    // 深紫色
        },
        accent: {
          purple: '#9F7AEA', // 柔和的紫色
          silver: '#A0AEC0', // 月光银
        },
        highlight: '#F6AD55', // 温暖的橙色
        customGray: '#718096', // 柔和的灰色
        reasoningBg: '#2D3748', // 深色背景
        fantasy: {
          DEFAULT: '#B794F4', // 梦幻色
          starlight: '#EDF2F7', // 星光色
          midnight: '#1A202C', // 午夜色
          dream: '#D6BCFA',   // 梦境色
        }
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
    // 注册自定义小按钮组件
    plugin(function({ addComponents, theme }) {
      const smallButtons = {
        '.btn-small': {
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`, // 内边距
          fontSize: theme('fontSize.sm'),                        // 小号字体
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.md'),
          backgroundColor: theme('colors.primary.DEFAULT'),
          color: theme('colors.white'),
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.primary.dark'),
          },
        },
      }
      addComponents(smallButtons)
    }),
      // 注册图标按钮组件 (.btn-refresh, .btn-copy, .btn-delete)
    plugin(function({ addComponents, theme }) {
      const iconButton = {
        '.btn-refresh, .btn-copy, .btn-delete': {  // 新增 .btn-delete
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${theme('spacing.2')} ${theme('spacing.3')}`, // 使用内边距控制尺寸
          fontSize: theme('fontSize.sm'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.md'), // 使用常规圆角
          backgroundColor: theme('colors.gray.400'),
          color: theme('colors.white'),
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: theme('colors.primary.DEFAULT'),
          },
        },
      }
      addComponents(iconButton)
    }) 
  ],

} 