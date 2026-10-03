/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        indigo: {
          950: '#0F1226',
          900: '#1E2447', // Primary Deep Indigo
          800: '#2A3267',
          700: '#39448C',
          600: '#4B59B3',
          500: '#6373D6',
          100: '#E8ECFB',
          50: '#F0F2FA',
        },
        purple: {
          950: '#220E38',
          900: '#381F68', // Royal Purple
          800: '#4E3188',
          700: '#6644A8',
          600: '#8359CA',
          100: '#F3EEFA',
          50: '#FAF7FD',
        },
        teal: {
          950: '#042A2E',
          900: '#095B62',
          800: '#0D7C85', // Rich Teal
          700: '#0F766E',
          600: '#0D9488',
          500: '#14B8A6', // Turquoise
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        saffron: {
          700: '#B45309',
          600: '#D97706', // Warm Saffron / Amber
          500: '#F59E0B',
          400: '#FBBF24',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        magenta: {
          700: '#A21CAF',
          600: '#C026D3', // Vibrant Magenta
          500: '#D946EF',
          100: '#FAE8FF',
          50: '#FDF4FF',
        },
        coral: {
          600: '#E11D48',
          500: '#F43F5E', // Vibrant Coral
          400: '#FB7185',
          100: '#FFE4E6',
          50: '#FFF1F2',
        },
        linen: {
          950: '#0C0A09',
          900: '#1C1917', // Deep Charcoal
          800: '#292524',
          700: '#44403C',
          600: '#57534E',
          500: '#78716C',
          400: '#A8A29E',
          300: '#D6D3D1',
          200: '#E7E5E4',
          100: '#F5F2EB', // Neutral Surface
          50: '#FAF8F5',  // Warm Ivory Canvas
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(30, 36, 71, 0.05), 0 1px 2px 0 rgba(30, 36, 71, 0.03)',
        'card': '0 4px 12px 0 rgba(30, 36, 71, 0.06)',
        'card-hover': '0 8px 20px 0 rgba(30, 36, 71, 0.10)',
        'modal': '0 20px 40px -10px rgba(30, 36, 71, 0.22)',
      }
    },
  },
  plugins: [],
}
