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
        // Paleta oficial de Costa Rica / Librería & Naturaleza:
        cr: {
          forestNight: '#132B20',   // Bosque tropical profundo nocturno (Sidebar / POS)
          forest: '#1A3D2F',        // Verde bosque lluvioso (Monteverde / Braulio Carrillo)
          moss: '#2D5E46',          // Verde follaje / Hoja de cafetal
          leaf: '#3E7356',          // Verde helecho claro
          terracotta: '#C05A3E',    // Terracota artesanal (Barro cocido de Guaitil / Tejas)
          terracottaHover: '#AA4C33', // Hover terracota
          terracottaLight: '#D97448', // Terracota cálida / arcilla viva
          wood: '#5C3622',          // Madera noble de estantería (Cedro amargo / Caoba)
          woodDark: '#422515',      // Madera oscura
          ivory: '#FAF7F0',         // Blanco Roto / Marfil luminoso (Lienzo principal)
          parchment: '#F3ECE0',     // Pergamino / Papel artesanal
          fiber: '#DFD5C4',         // Fibra natural / Borde suave
        },
        palette: {
          midnight: '#132B20',
          forestDark: '#132B20',
          slateNavy: '#2D5E46',
          steel: '#3E7356',
          silver: '#DFD5C4',
          offWhite: '#FAF7F0',
          terracotta: '#C05A3E',
          wood: '#5C3622',
        },
        brand: {
          navy: '#132B20',
          dark: '#1A3D2F',
          blue: '#C05A3E',
          blueHover: '#AA4C33',
          amber: '#D97448',
          amberDark: '#5C3622',
          emerald: '#2D5E46',
          rose: '#C05A3E',
          sky: '#3E7356',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(19, 43, 32, 0.05), 0 1px 2px 0 rgba(19, 43, 32, 0.03)',
        'premium': '0 4px 20px -2px rgba(19, 43, 32, 0.08), 0 2px 6px -1px rgba(19, 43, 32, 0.04)',
        'terracotta': '0 4px 20px -2px rgba(192, 90, 62, 0.35)',
        'forest': '0 4px 20px -2px rgba(26, 61, 47, 0.3)',
      }
    },
  },
  plugins: [],
}
