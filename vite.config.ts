import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
const keyPath = fileURLToPath(new URL('./certs/localhost-key.pem', import.meta.url))
const certificatePath = fileURLToPath(new URL('./certs/localhost.pem', import.meta.url))
const httpsEnabled =
  process.env.VITE_HTTPS === 'true' && existsSync(keyPath) && existsSync(certificatePath)
const basePath = process.env.VITE_BASE_PATH ?? '/BusinessNavigation/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    host: true,
    ...(httpsEnabled
      ? { https: { key: readFileSync(keyPath), cert: readFileSync(certificatePath) } }
      : {}),
  },
})
