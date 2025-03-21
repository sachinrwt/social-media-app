import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  //changing the server to localhost:3000, by default it was localhost:5173
  server:{
    port: 3000,
    proxy:{
      "/api":{
        target: "http://localhost:5000",
        changeOrigin: true,
      }
    }
  },
});
