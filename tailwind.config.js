/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#FF10F0',
          blue: '#00F0FF',
          green: '#0FFF50',
          purple: '#9D00FF',
          yellow: '#FFFF00',
          orange: '#FF6B00',
        },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-neon': 'pulse-neon 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          'from': {
            'text-shadow': '0 0 10px #FF10F0, 0 0 20px #FF10F0, 0 0 30px #FF10F0, 0 0 40px #FF10F0',
          },
          'to': {
            'text-shadow': '0 0 20px #FF10F0, 0 0 30px #FF10F0, 0 0 40px #FF10F0, 0 0 50px #FF10F0',
          }
        },
        'pulse-neon': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: .5,
          },
        },
        gradient: {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-20px)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(135deg, #FF10F0 0%, #00F0FF 25%, #0FFF50 50%, #9D00FF 75%, #FF10F0 100%)',
      },
      boxShadow: {
        'neon-pink': '0 0 5px theme("colors.neon.pink"), 0 0 20px theme("colors.neon.pink")',
        'neon-blue': '0 0 5px theme("colors.neon.blue"), 0 0 20px theme("colors.neon.blue")',
        'neon-green': '0 0 5px theme("colors.neon.green"), 0 0 20px theme("colors.neon.green")',
        'neon-purple': '0 0 5px theme("colors.neon.purple"), 0 0 20px theme("colors.neon.purple")',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}