import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const dashscopeKey = env.DASHSCOPE_API_KEY || env.VITE_DASHSCOPE_API_KEY || '';

  return {
    plugins: [react()],
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
