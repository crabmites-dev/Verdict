/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Nous utilisons une syntaxe d'import dynamique robuste pour éviter les soucis de modules Windows
    await import('daisyui').then(m => m.default || m)
  ],
  daisyui: {
    themes: ["winter"], 
  },
}
