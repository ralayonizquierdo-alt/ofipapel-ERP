import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Tres modos de build:
// - dev (por defecto): servidor de desarrollo, base '/'.
// - static (npm run build:static): todo inlineado en un único index.html autocontenido
//   (viteSingleFile) con HashRouter, para abrir el archivo a mano con doble clic sin servidor.
// - pages (npm run build): build normal de varios ficheros para publicar en GitHub Pages,
//   bajo /ofipapel-erp/. También usa HashRouter para no depender de que el servidor resuelva
//   rutas profundas (GitHub Pages no tiene reescritura de rutas tipo SPA).
export default defineConfig(({ mode }) => {
  const isStatic = mode === 'static'
  const isPages = mode === 'pages'
  return {
    base: isStatic ? './' : isPages ? '/ofipapel-erp/' : '/',
    plugins: [react(), tailwindcss(), ...(isStatic ? [viteSingleFile()] : [])],
    define: {
      __USE_HASH_ROUTER__: isStatic || isPages,
    },
  }
})
