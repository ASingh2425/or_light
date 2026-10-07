/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: 'var(--theme-panel, #0e121b)',
          darker: 'var(--theme-bg, #080b11)',
          carbon: '#121722',
          gunmetal: '#182030',
          card: 'rgba(18, 23, 34, 0.88)',
          border: '#d49b28',
          orange: '#ff8800',
          'orange-glow': '#ffa733',
          gold: '#d49b28',
          'gold-light': '#f3c460',
          'gold-dark': '#8e6315',
          goldGlow: 'rgba(212, 155, 40, 0.45)',
          amber: '#ffaa00',
          amberGlow: 'rgba(255, 170, 0, 0.4)',
          cyan: '#00f0ff',
          green: '#00ff88',
          red: '#ff3344',
          muted: '#8a99ad',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(212, 155, 40, 0.35)',
        'gold-glow-lg': '0 0 35px rgba(212, 155, 40, 0.6)',
        'orange-glow': '0 0 20px rgba(255, 136, 0, 0.35)',
        'green-glow': '0 0 20px rgba(0, 255, 136, 0.4)',
        'terminal-glow': '0 0 30px rgba(212, 155, 40, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'deny-badge': 'denyPop 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both, denyShake 0.38s ease-in-out 0.35s 3',
        'input-shake': 'inputShake 0.4s ease-in-out',
        'error-flash': 'errorFlash 0.7s ease-out forwards',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        denyPop: {
          '0%': { transform: 'scale(0.5) rotate(-4deg)', opacity: '0' },
          '55%': { transform: 'scale(1.07) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        denyShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-7px)' },
          '40%': { transform: 'translateX(7px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        inputShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        errorFlash: {
          '0%': { opacity: '0.45' },
          '100%': { opacity: '0' },
        },
      }
    },
  },
  plugins: [],
};
