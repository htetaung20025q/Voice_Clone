import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import type { Language } from '../services/i18n';
import { translations } from '../services/i18n';

interface DocsProps {
  language: Language;
}

export const Docs: React.FC<DocsProps> = ({ language }) => {
  const t = translations[language].docsPage;
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'ts'>('curl');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = `curl -X POST "http://localhost:8000/api/v1/tts" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "မင်္ဂလာပါ ခင်ဗျာ။ BurmaVoice မှ ကြိုဆိုပါတယ်။",
    "voice": "thiri",
    "style": "natural",
    "language": "myanmar",
    "speed": 1.0
  }' \\
  --output myanmar_speech.wav`;

  const pythonExample = `import requests

url = "http://localhost:8000/api/v1/tts"
payload = {
    "text": "မင်္ဂလာပါ ခင်ဗျာ။ BurmaVoice မှ ကြိုဆိုပါတယ်။",
    "voice": "thiri",
    "style": "natural",
    "language": "myanmar",
    "speed": 1.0
}

response = requests.post(url, json=payload)
if response.status_code == 200:
    with open("myanmar_speech.wav", "wb") as f:
        f.write(response.content)
    print(f"Audio saved! Duration: {response.headers.get('X-Audio-Duration')}s")`;

  const tsExample = `const res = await fetch("http://localhost:8000/api/v1/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "မင်္ဂလာပါ ခင်ဗျာ။ BurmaVoice မှ ကြိုဆိုပါတယ်။",
    voice: "thiri",
    style: "natural",
    language: "myanmar",
    speed: 1.0
  }),
});

const audioBlob = await res.blob();
const audioUrl = URL.createObjectURL(audioBlob);
new Audio(audioUrl).play();`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-myanmar-red-light border border-myanmar-red/20 text-myanmar-red text-xs font-semibold">
          <Sparkles className="w-3 h-3 text-myanmar-gold" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-600">
          {t.subtitle}
        </p>
      </div>

      {/* Base URL */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs">
        <div>
          <span className="font-semibold text-zinc-700">Base URL: </span>
          <span className="font-mono text-zinc-900">http://localhost:8000</span>
        </div>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-myanmar-red hover:underline transition-colors"
        >
          <span>Open Interactive Swagger API</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Endpoint Reference */}
      <div className="space-y-6 border-t border-zinc-200 pt-10">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-myanmar-red text-white">
            POST
          </span>
          <span className="font-mono text-sm font-bold text-zinc-900">/api/v1/tts</span>
        </div>

        {/* Parameter Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200 text-zinc-500 font-mono">
              <tr>
                <th className="py-2 pr-4">Field</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Required</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="py-2.5 font-mono font-medium text-zinc-900">text</td>
                <td className="py-2.5 font-mono text-zinc-500">string</td>
                <td className="py-2.5 font-semibold text-myanmar-red">Yes</td>
                <td className="py-2.5 text-zinc-600">1 to 5,000 characters of Myanmar Unicode or English text.</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-medium text-zinc-900">voice</td>
                <td className="py-2.5 font-mono text-zinc-500">string</td>
                <td className="py-2.5 text-zinc-400">Optional</td>
                <td className="py-2.5 text-zinc-600">Myanmar voice: thiri, aung, may, min, nandar, kyaw. Default: "thiri".</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-medium text-zinc-900">style</td>
                <td className="py-2.5 font-mono text-zinc-500">string</td>
                <td className="py-2.5 text-zinc-400">Optional</td>
                <td className="py-2.5 text-zinc-600">Speaking style: natural, professional, friendly, storytelling, news, calm.</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-medium text-zinc-900">language</td>
                <td className="py-2.5 font-mono text-zinc-500">string</td>
                <td className="py-2.5 text-zinc-400">Optional</td>
                <td className="py-2.5 text-zinc-600">Language mode: myanmar, english, bilingual. Default: "myanmar".</td>
              </tr>
              <tr>
                <td className="py-2.5 font-mono font-medium text-zinc-900">speed</td>
                <td className="py-2.5 font-mono text-zinc-500">number</td>
                <td className="py-2.5 text-zinc-400">Optional</td>
                <td className="py-2.5 text-zinc-600">Playback speed multiplier (0.5 to 2.0). Default: 1.0.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Code Snippet Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <div className="flex items-center gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('curl')}
                className={`pb-1 cursor-pointer transition-colors ${
                  activeTab === 'curl' ? 'text-myanmar-red border-b-2 border-myanmar-red font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('python')}
                className={`pb-1 cursor-pointer transition-colors ${
                  activeTab === 'python' ? 'text-myanmar-red border-b-2 border-myanmar-red font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ts')}
                className={`pb-1 cursor-pointer transition-colors ${
                  activeTab === 'ts' ? 'text-myanmar-red border-b-2 border-myanmar-red font-semibold' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                TypeScript
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const code = activeTab === 'curl' ? curlExample : activeTab === 'python' ? pythonExample : tsExample;
                handleCopy(code, 'docs-code');
              }}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              {copied === 'docs-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied === 'docs-code' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 overflow-x-auto leading-relaxed">
            {activeTab === 'curl' ? curlExample : activeTab === 'python' ? pythonExample : tsExample}
          </pre>
        </div>

      </div>

    </div>
  );
};
