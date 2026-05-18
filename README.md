# 合盘 CONVERGE

跨维度命理分析工具 — 生辰八字 · 紫微斗数 · 西洋占星 · 印度占星

## 技术栈

- React 19 + Vite 8
- html2canvas（长图导出）
- Google Fonts（Noto Serif SC / Noto Sans SC）
- 纯 CSS（无 UI 框架依赖）

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173/`

## 对接 AI API

项目默认向 `/api/chat` 发送 OpenAI 兼容的 Chat Completions 请求（支持 stream）。

### 请求格式

```json
POST /api/chat
{
  "messages": [
    { "role": "system", "content": "命理分析 System Prompt..." },
    { "role": "user", "content": "性别：男\n出生日期：1990-01-01\n..." }
  ],
  "stream": true
}
```

### 响应格式（SSE 流式）

```
data: {"choices":[{"delta":{"content":"..."}}]}

data: [DONE]
```

### 推荐方案

1. **本地代理**：用 Vite proxy 转发到 AI API，避免前端暴露 API Key
2. **云函数**：部署一个 Serverless 函数做 `/api/chat` 代理

Vite proxy 配置示例（`vite.config.js`）：

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/v1'),
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      },
    },
  },
});
```

## 自定义 System Prompt

页面底部有「API 设置」折叠面板，可以直接在页面上修改 API 地址和 System Prompt，无需改代码。

## 构建部署

```bash
npm run build     # 输出到 dist/
npm run preview   # 本地预览构建产物
```

`dist/` 目录下的静态文件可以直接部署到任何 CDN 或静态托管服务。