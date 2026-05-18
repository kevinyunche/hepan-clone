import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

/* ===== 默认 System Prompt ===== */
const DEFAULT_SYSTEM_PROMPT = `你是一位精通东西方命理学的资深命理大师，擅长从以下四个维度综合分析：

1. **生辰八字**（中国传统命理学）：分析先天底色与岁运流转
2. **紫微斗数**（中国传统星命学）：分析人际格局与生命轨迹
3. **西洋占星**（西方占星学）：分析心理原型与动能解析
4. **印度占星**（吠陀占星学）：分析业力因果与物质成就

请基于用户提供的出生信息，按上述四个维度分别给出分析，每个维度包含核心结论和详细解读。最后给出一个综合性的整体评价。

输出格式要求：
- 使用 Markdown 格式
- 每个维度用小标题分隔
- 语言文雅但不晦涩，让普通人也能读懂
- 适当使用 emoji 增强可读性`;

/* ===== 默认 API 地址（可自行替换）===== */
const DEFAULT_API_URL = '/api/chat';
const DEFAULT_MODEL = 'qwen-plus';
const DEFAULT_API_KEY = '';

function App() {
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [location, setLocation] = useState('');
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showSettings, setShowSettings] = useState(false);

  const resultRef = useRef(null);

  const buildUserMessage = useCallback(() => {
    const parts = [];
    if (gender) parts.push(`性别：${gender}`);
    if (birthDate) parts.push(`出生日期：${birthDate}`);
    if (birthTime) parts.push(`出生时间：${birthTime}`);
    if (location) parts.push(`出生地点：${location}`);
    if (question) parts.push(`所问之事：${question}`);
    return parts.join('\n');
  }, [gender, birthDate, birthTime, location, question]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!birthDate) {
      setError('请至少填写出生日期');
      return;
    }
    setError('');
    setResult('');
    setLoading(true);

    const userMessage = buildUserMessage();

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败：${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setResult((prev) => prev + content);
            }
          } catch {
            // 非 JSON 行，跳过
          }
        }
      }
    } catch (err) {
      setError(err.message || '请求失败，请检查 API 地址和网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleExportImage = async () => {
    if (!resultRef.current) return;
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#fffdf8',
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `合盘分析_${birthDate || '未命名'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      setError('导出图片失败，请重试');
    }
  };

  const renderMarkdown = (text) => {
    let html = text
      // 标题
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // 粗体
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 换行
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
  };

  return (
    <div className="app">
      {/* ===== 顶部标题区 ===== */}
      <header className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <h1 className="hero-title">合盘</h1>
          <p className="hero-subtitle">CONVERGE</p>
          <p className="hero-desc">
            生辰八字 · 紫微斗数 · 西洋占星 · 印度占星
            <br />
            跨维度的精准洞察，四种命理体系合而为一
          </p>
        </div>
      </header>

      {/* ===== 表单区 ===== */}
      <section className="form-section">
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">
              <span className="label-text">性别</span>
              <div className="gender-group">
                <button
                  type="button"
                  className={`gender-btn ${gender === '男' ? 'active' : ''}`}
                  onClick={() => setGender('男')}
                >
                  男
                </button>
                <button
                  type="button"
                  className={`gender-btn ${gender === '女' ? 'active' : ''}`}
                  onClick={() => setGender('女')}
                >
                  女
                </button>
              </div>
            </label>
          </div>

          <div className="form-row split">
            <label className="form-label">
              <span className="label-text">出生日期</span>
              <input
                type="date"
                className="form-input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </label>
            <label className="form-label">
              <span className="label-text">出生时间</span>
              <input
                type="time"
                className="form-input"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span className="label-text">出生地点</span>
              <input
                type="text"
                className="form-input"
                placeholder="例如：北京、上海、杭州……"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span className="label-text">所问之事</span>
              <textarea
                className="form-input form-textarea"
                placeholder="你想问什么？事业、感情、财运、健康……"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <span className="dot-pulse" />
                正在合盘推演中……
              </span>
            ) : (
              '开启合盘分析'
            )}
          </button>
        </form>
      </section>

      {/* ===== 设置区（可折叠）===== */}
      <section className="settings-section">
        <button
          type="button"
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️ API 设置 {showSettings ? '▲' : '▼'}
        </button>
        {showSettings && (
          <div className="settings-panel">
            <label className="form-label">
              <span className="label-text">API Key</span>
              <input
                type="password"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxxxxxxxx"
              />
            </label>
            <label className="form-label">
              <span className="label-text">模型</span>
              <select
                className="form-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                <option value="qwen-turbo">qwen-turbo（最快最便宜）</option>
                <option value="qwen-plus">qwen-plus（均衡）</option>
                <option value="qwen-max">qwen-max（最强）</option>
              </select>
            </label>
            <label className="form-label">
              <span className="label-text">API 地址</span>
              <input
                type="text"
                className="form-input"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api/chat"
              />
            </label>
            <label className="form-label">
              <span className="label-text">System Prompt（可自定义）</span>
              <textarea
                className="form-input form-textarea"
                rows={8}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      {/* ===== 错误提示 ===== */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* ===== 结果展示区 ===== */}
      {result && (
        <section className="result-section" ref={resultRef}>
          <div className="result-header">
            <h2>合盘分析结果</h2>
            <p className="result-meta">
              {birthDate && `${birthDate}`}
              {birthTime && ` ${birthTime}`}
              {location && ` · ${location}`}
            </p>
          </div>
          <div
            className="result-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}
          />
          <div className="result-footer">
            <button
              type="button"
              className="export-btn"
              onClick={handleExportImage}
            >
              📸 导出为长图
            </button>
          </div>
        </section>
      )}

      {/* ===== 底部 ===== */}
      <footer className="footer">
        <p>合盘 CONVERGE — 跨维度命理分析</p>
        <p className="footer-note">
          本工具仅供娱乐参考，不构成任何人生决策建议
        </p>
      </footer>
    </div>
  );
}

export default App;