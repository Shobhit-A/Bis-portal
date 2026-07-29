export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1F5C99', dark: '#174a7a', light: '#2E75B6' },
        surface: '#F8F9FA',
        border: '#DEE2E6',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    }
  },
  plugins: []
}
