import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Cloudflare 插件按需加载（本地开发用），Vercel 构建时不加载
const isCloudflare = process.env.CF === '1';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dashscopeKey = env.DASHSCOPE_API_KEY || env.VITE_DASHSCOPE_API_KEY || '';

  return {
    plugins: [
      react(),
      isCloudflare ? (await import('@cloudflare/vite-plugin')).cloudflare() : undefined,
    ].filter(Boolean),
    server: {
      proxy: {
        '/api/chat': {
          target: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/chat/, '/chat/completions'),
          headers: {
            Authorization: dashscopeKey ? `Bearer ${dashscopeKey}` : undefined,
          },
        },
      },
    },
  };
});