/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./login.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      colors: {
        bubble: {
          primary: '#667eea',
          secondary: '#764ba2',
          accent: '#ff6b6b',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      backgroundImage: {
        'bubble-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'bubble-accent': 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'slide-down': 'slide-down 1s ease-out',
        'slide-up': 'slide-up 1s ease-out 0.3s both',
        'fade-in': 'fade-in 1s ease-out 0.6s both',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { 
            transform: 'translateY(100vh) rotate(0deg)', 
            opacity: '0' 
          },
          '10%, 90%': { 
            opacity: '1' 
          },
          '50%': { 
            transform: 'translateY(-100px) rotate(180deg)' 
          },
        },
        'slide-down': {
          from: { 
            opacity: '0', 
            transform: 'translateY(-50px)' 
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'slide-up': {
          from: { 
            opacity: '0', 
            transform: 'translateY(50px)' 
          },
          to: { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'fade-in': {
          from: { 
            opacity: '0' 
          },
          to: { 
            opacity: '1' 
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      boxShadow: {
        'bubble': '0 8px 32px rgba(102, 126, 234, 0.3)',
        'bubble-lg': '0 12px 40px rgba(102, 126, 234, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 12px 40px rgba(0, 0, 0, 0.15)',
      },
      textShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 2px 4px rgba(0, 0, 0, 0.5)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.5)',
        'xl': '0 8px 16px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [
    // Add text shadow plugin
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-xl': {
          textShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
      }
      addUtilities(newUtilities)
    },
    // Add glass morphism utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}
