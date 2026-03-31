/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#080a0f',
                surface: '#111319',
                primary: '#f59e0b',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                obsidian: {
                    bg: '#111319',
                    'surface-lowest': '#0c0e13',
                    'surface-low': '#191b21',
                    'surface': '#1e1f25',
                    'surface-high': '#282a30',
                    'surface-highest': '#33353a',
                },
                amber: {
                    50: '#fffbeb',
                    100: '#fef3c7',
                    200: '#fde68a',
                    300: '#fcd34d',
                    400: '#fbbf24',
                    500: '#f59e0b',
                    600: '#d97706',
                    700: '#b45309',
                    800: '#92400e',
                    900: '#78350f',
                    primary: '#ffc174',
                    secondary: '#f0bd82',
                },
                brand: {
                    DEFAULT: '#7311d4',
                    light: '#9d4edd',
                    dark: '#5a0bb0',
                },
                electric: '#00d2ff',
                gold: '#D4AF37',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                'twelve': '12px',
            },
            backgroundImage: {
                'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            }
        },
    },
    plugins: [],
}
