/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Netflix-inspired dark palette
        dark: {
          50: '#f8fafc',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#141421',
          900: '#0a0a0f',
          950: '#050507',
        },
        // Premium accent colors
        accent: {
          red: '#e50914',
          blue: '#0071e3',
          purple: '#a855f7',
          emerald: '#10b981',
          amber: '#f59e0b',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.03)',
          light: 'rgba(255, 255, 255, 0.06)',
          medium: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.12)',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(59, 130, 246, 0.3)',
        'glow-md': '0 0 25px -5px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(59, 130, 246, 0.5)',
        'glow-red': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'card': '0 4px 24px -4px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 12px 40px -8px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(120, 119, 198, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(225, 29, 72, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.15) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}