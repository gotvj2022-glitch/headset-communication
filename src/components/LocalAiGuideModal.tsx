import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Copy,
  Check,
  Terminal,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  Code,
  Sparkles,
  Layers,
  ArrowRight,
  Wifi,
  Globe,
  Radio
} from 'lucide-react';
import { LocalAiConfig } from '../types';

interface LocalAiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig?: LocalAiConfig;
  onApplyConfig?: (config: LocalAiConfig) => void;
}

export const LocalAiGuideModal: React.FC<LocalAiGuideModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onApplyConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'openwebui' | 'docker' | 'lmstudio' | 'ollama' | 'vllm'>('openwebui');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (tab: 'openwebui' | 'docker' | 'lmstudio' | 'ollama' | 'vllm') => {
    if (!onApplyConfig) return;
    if (tab === 'openwebui') {
      onApplyConfig({
        enabled: true,
        provider: 'openwebui',
        endpoint: 'http://172.30.115.239:8090/api',
        model: 'google/gemma-4-e4b',
        apiKey: currentConfig?.apiKey || '',
        temperature: 0.1,
        dockerOfflineEnabled: true,
        whisperEndpoint: 'http://172.30.115.239:8000/v1',
        whisperModel: 'Systran/faster-whisper-small',
        localAiTtsEndpoint: 'http://172.30.115.239:8081/v1',
        localAiTtsVoice: 'en-us-male',
        lanHostIp: '172.30.115.239',
      });
    } else if (tab === 'docker') {
      onApplyConfig({
        enabled: true,
        provider: 'docker',
        endpoint: 'http://172.30.115.239:8081/v1',
        model: 'localai',
        apiKey: '',
        temperature: 0.1,
        dockerOfflineEnabled: true,
        whisperEndpoint: 'http://172.30.115.239:8000/v1',
        whisperModel: 'Systran/faster-whisper-small',
        localAiTtsEndpoint: 'http://172.30.115.239:8081/v1',
        localAiTtsVoice: 'en-us-male',
        lanHostIp: '172.30.115.239',
      });
    } else if (tab === 'lmstudio') {
      onApplyConfig({
        enabled: true,
        provider: 'lmstudio',
        endpoint: 'http://172.30.115.239:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: '',
        temperature: 0.1,
        dockerOfflineEnabled: false,
      });
    } else if (tab === 'ollama') {
      onApplyConfig({
        enabled: true,
        provider: 'ollama',
        endpoint: 'http://172.30.115.239:11434/v1',
        model: 'qwen3.8:27b',
        apiKey: '',
        temperature: 0.1,
        dockerOfflineEnabled: false,
      });
    } else {
      onApplyConfig({
        enabled: true,
        provider: 'vllm',
        endpoint: 'http://172.30.115.239:8000/v1',
        model: 'Qwen/Qwen2.5-3B-Instruct',
        apiKey: '',
        temperature: 0.1,
        dockerOfflineEnabled: false,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col text-slate-800 overflow-hidden animate-scaleIn">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-xs">
              <Server className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Hướng Dẫn Cấu Hình Kết Nối Local AI
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  Offline LLMs
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                URL Endpoint · Tên Model · Header HTTP · Payload chuẩn AeroComms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('openwebui')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'openwebui'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <Globe className="w-4 h-4" />
            <span>Open WebUI (Máy Chủ WiFi)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">172.30.115.239:8090</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docker')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'docker'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>🐳 Docker Offline Suite</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">Port 8000 & 8081</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lmstudio')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lmstudio'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>LM Studio</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">Port 1234</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ollama')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ollama'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-500" />
            <span>Ollama</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">Port 11434</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vllm')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'vllm'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>vLLM</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10">Port 8000</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          
          {/* Active Quick Apply Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-blue-50 to-amber-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  Cài đặt nhanh 1 chạm cho {activeTab === 'openwebui' ? 'Open WebUI (Máy Chủ WiFi 172.30.115.239:8090)' : activeTab === 'docker' ? 'Docker Offline Suite (Whisper :8000 + LocalAI :8081)' : activeTab === 'lmstudio' ? 'LM Studio' : activeTab === 'ollama' ? 'Ollama' : 'vLLM'}
                </h4>
                <p className="text-[11px] text-slate-600">
                  {activeTab === 'openwebui'
                    ? 'Kết nối máy học viên trên cùng mạng WiFi với Open WebUI (cổng 8090), Faster-Whisper (8000) và LocalAI (8081) trên máy chủ 172.30.115.239.'
                    : activeTab === 'docker'
                    ? 'Tự động kích hoạt Faster-Whisper (:8000) nhận diện giọng nói và LocalAI (:8081) chấm điểm & phát âm thanh 100% Offline.'
                    : 'Tự động điền đầy đủ URL Endpoint, tên mô hình và lưu vào giao diện đàm thoại.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleApplyPreset(activeTab)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95 text-xs"
            >
              <span>Áp Dụng Cấu Hình Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB: OPEN WEBUI ON WIFI LAN */}
          {activeTab === 'openwebui' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Server Network Info Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3 border border-slate-700 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-slate-200 text-xs sm:text-sm">Máy Chủ Đào Tạo WiFi (172.30.115.239)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
                    Mạng Nội Bộ WiFi / LAN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>🌐 Open WebUI</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded">Port 8090</span>
                    </div>
                    <div className="text-[11px] text-slate-300">ghcr.io/open-webui/open-webui:main</div>
                    <div className="text-[10px] text-slate-400 font-sans">OpenAI-compatible LLM Chat API</div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-blue-400 font-bold">
                      <span>🎤 faster-whisper</span>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.2 rounded">Port 8000</span>
                    </div>
                    <div className="text-[11px] text-slate-300">faster-whisper-server:cpu</div>
                    <div className="text-[10px] text-slate-400 font-sans">STT nhận dạng giọng học viên &lt; 300ms</div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span>🔊 localai-tts</span>
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded">Port 8081</span>
                    </div>
                    <div className="text-[11px] text-slate-300">localai:latest-aio-cpu</div>
                    <div className="text-[10px] text-slate-400 font-sans">Giọng đọc kiểm soát viên & chấm điểm</div>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>IPv4: <strong className="text-emerald-400">172.30.115.239</strong></span>
                  <span>Subnet: <strong className="text-slate-200">255.255.0.0</strong></span>
                  <span>Gateway: <strong className="text-slate-200">172.30.119.1</strong></span>
                </div>
              </div>

              {/* Service 1: Open WebUI */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                    Open WebUI Endpoint (Cổng 8090):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://172.30.115.239:8090/api', 'openwebui_url')}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'openwebui_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'openwebui_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-700 font-bold select-all flex items-center justify-between">
                  <span>http://172.30.115.239:8090/api</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/chat/completions (OpenAI Compatible)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Học viên trên laptop mở trình duyệt vào <code className="text-emerald-700 font-bold">http://172.30.115.239:8090</code> để kiểm tra kết nối web Open WebUI.
                  <br />• Nếu Open WebUI bật yêu cầu đăng nhập: vào <strong>Settings → Account → API Keys</strong> để tạo key và dán vào ô <em>API Key</em> của ứng dụng.
                </p>
              </div>

              {/* Service 2: Faster Whisper */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                    Faster-Whisper STT Server Trên Máy Chủ (Cổng 8000):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://172.30.115.239:8000/v1', 'whisper_lan_url')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'whisper_lan_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'whisper_lan_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-blue-700 font-bold select-all flex items-center justify-between">
                  <span>http://172.30.115.239:8000/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/audio/transcriptions</span>
                </div>
              </div>

              {/* Service 3: LocalAI TTS */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-600 text-white flex items-center justify-center text-xs">3</span>
                    LocalAI TTS & Audio Trên Máy Chủ (Cổng 8081):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://172.30.115.239:8081/v1', 'localai_lan_url')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'localai_lan_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'localai_lan_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-amber-700 font-bold select-all flex items-center justify-between">
                  <span>http://172.30.115.239:8081/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/audio/speech</span>
                </div>
              </div>

              {/* Firewall instructions */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Lưu ý Tường Lửa (Windows Firewall) Trên Máy Chủ:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('New-NetFirewallRule -DisplayName "OpenWebUI-LocalAI" -Direction Inbound -LocalPort 8090,8000,8081 -Protocol TCP -Action Allow', 'firewall_cmd')}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'firewall_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'firewall_cmd' ? 'Đã copy!' : 'Sao chép lệnh'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Nếu các máy laptop kết nối chung WiFi nhưng không mở được <code>http://172.30.115.239:8090</code>, hãy mở <strong>PowerShell với quyền Administrator</strong> trên máy chủ <code>172.30.115.239</code> và dán lệnh sau để cho phép thông các cổng:
                </p>
                <pre className="bg-slate-900 text-emerald-400 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto select-all">
                  New-NetFirewallRule -DisplayName "OpenWebUI-LocalAI" -Direction Inbound -LocalPort 8090,8000,8081 -Protocol TCP -Action Allow
                </pre>
              </div>
            </div>
          )}

          {/* TAB 0: DOCKER OFFLINE SUITE */}
          {activeTab === 'docker' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Docker Containers Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-3 border border-slate-700 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-slate-200 text-xs sm:text-sm">Trạng Thái Docker Containers Trên Máy Chủ</span>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
                    Host: localhost
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>🎤 faster-whisper</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded">8000:8000</span>
                    </div>
                    <div className="text-[11px] text-slate-300">fedirz/faster-whisper-server:latest-cpu</div>
                    <div className="text-[10px] text-slate-400 font-sans">Nhận diện giọng nói siêu tốc &lt; 300ms</div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span>🔊 localai-tts</span>
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded">8081:8080</span>
                    </div>
                    <div className="text-[11px] text-slate-300">localai/localai:latest-aio-cpu</div>
                    <div className="text-[10px] text-slate-400 font-sans">Tạo giọng nói AI & Chấm điểm ICAO</div>
                  </div>
                </div>
              </div>

              {/* Service 1: Faster-Whisper */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                    Faster-Whisper STT Endpoint (Cổng 8000):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:8000/v1', 'whisper_url')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'whisper_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'whisper_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-blue-700 font-bold select-all flex items-center justify-between">
                  <span>http://localhost:8000/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/audio/transcriptions</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Nhận trực tiếp luồng microphone học viên, chuyển thể thành văn bản trong vài trăm mili-giây không cần qua internet.
                </p>
              </div>

              {/* Service 2: LocalAI */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                    LocalAI TTS & LLM Endpoint (Cổng 8081):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:8081/v1', 'localai_url')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'localai_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'localai_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-amber-700 font-bold select-all flex items-center justify-between">
                  <span>http://localhost:8081/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">/audio/speech & /chat/completions</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Phát âm thanh đáp từ phi công / thợ máy và chấm điểm khẩu lệnh tiêu chuẩn ICAO.
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: LM STUDIO */}
          {activeTab === 'lmstudio' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Field 1: Endpoint */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">1</span>
                    URL Endpoint Máy Chủ (Local Server):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:1234/v1', 'lms_url')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-red-700 font-bold select-all flex items-center justify-between">
                  <span>http://localhost:1234/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">Đường dẫn tương thích OpenAI</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • Trong LM Studio, bấm vào biểu tượng <strong>Developer (&lt;&gt;)</strong> ở thanh bên trái.<br />
                  • Bật công tắc <strong>Start Server</strong>. Cổng mặc định là <code>1234</code>.
                </p>
              </div>

              {/* Field 2: Model Name */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">2</span>
                    Tên Mô Hình (Model Identifier):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('google/gemma-4-e4b', 'lms_model')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_model' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_model' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-700 font-bold select-all flex items-center justify-between">
                  <span>google/gemma-4-e4b</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đang nạp trên máy bạn
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-600">
                  <span>Mô hình phụ slot 2:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('google/gemma-4-e4b:2', 'lms_model2')}
                    className="font-mono bg-white px-2 py-0.5 rounded border border-slate-300 hover:border-red-400 text-slate-800 cursor-pointer"
                  >
                    google/gemma-4-e4b:2
                  </button>
                </div>
              </div>

              {/* Field 3: LM Studio API Key */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">3</span>
                    LM Studio API Key (Khóa xác thực):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('lms-sk-mogsZrILq30R1EUfjaGjo7Xt6kUDfZ-_psT61ZErzYA', 'lms_apikey')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_apikey' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_apikey' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-800 font-bold select-all flex items-center justify-between">
                  <span className="truncate mr-2">lms-sk-mogsZrILq30R1EUfjaGjo7Xt6kUDfZ-_psT61ZErzYA</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold shrink-0">
                    Key của bạn
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  AeroComms tự động gắn key này trong header <code>Authorization: Bearer ...</code> để xác thực với server LM Studio của bạn.
                </p>
              </div>

              {/* Field 4: Header HTTP */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">4</span>
                    Định Dạng HTTP Request Header:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        'Content-Type: application/json\nAuthorization: Bearer lms-sk-mogsZrILq30R1EUfjaGjo7Xt6kUDfZ-_psT61ZErzYA',
                        'lms_headers'
                      )
                    }
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_headers' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_headers' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`POST /v1/chat/completions HTTP/1.1
Host: localhost:1234
Content-Type: application/json
Authorization: Bearer lms-sk-mogsZrILq30R1EUfjaGjo7Xt6kUDfZ-_psT61ZErzYA`}
                </pre>
                <p className="text-[11px] text-slate-500">
                  AeroComms tự động cấu hình các header này khi gửi yêu cầu chấm điểm khẩu lệnh và hội thoại.
                </p>
              </div>

              {/* Field 4: Request Payload Sample */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-amber-600" />
                    Cấu Trúc Payload JSON Gửi Tới Mô Hình:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(
                          {
                            model: 'google/gemma-4-e4b',
                            messages: [
                              {
                                role: 'system',
                                content: 'Victoria Aviation Academy (VIAA) ICAO Evaluator',
                              },
                              {
                                role: 'user',
                                content: 'Student: Ground to Cockpit, release parking brakes.',
                              },
                            ],
                            temperature: 0.1,
                          },
                          null,
                          2
                        ),
                        'lms_payload'
                      )
                    }
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_payload' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_payload' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-amber-200 rounded-xl p-3 font-mono text-[11px] leading-relaxed overflow-x-auto">
{`{
  "model": "google/gemma-4-e4b",
  "messages": [
    { "role": "system", "content": "Victoria Aviation Academy (VIAA) ICAO Evaluator..." },
    { "role": "user", "content": "Student: Ground to Cockpit, release parking brakes." }
  ],
  "temperature": 0.1
}`}
                </pre>
              </div>

              {/* Terminal Ping Command */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-400">
                    <Terminal className="w-4 h-4" />
                    Lệnh Kiểm Tra Trạng Thái Server (Terminal / PowerShell):
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('curl http://localhost:1234/v1/models', 'lms_curl')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'lms_curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'lms_curl' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-black/60 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-400 select-all">
                  curl http://localhost:1234/v1/models
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OLLAMA */}
          {activeTab === 'ollama' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Field 1: Endpoint */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">1</span>
                    URL Endpoint Ollama:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:11434/v1', 'ollama_url')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'ollama_url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ollama_url' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-red-700 font-bold select-all flex items-center justify-between">
                  <span>http://localhost:11434/v1</span>
                  <span className="text-[10px] text-slate-400 font-sans font-normal">Cổng 11434</span>
                </div>
              </div>

              {/* Field 2: Model Name */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-red-600 text-white flex items-center justify-center text-xs">2</span>
                    Tên Mô Hình Ollama:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('qwen3.8:27b', 'ollama_model')}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'ollama_model' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'ollama_model' ? 'Đã copy!' : 'Sao chép'}</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-800 font-bold select-all flex items-center justify-between">
                  <span>qwen3.8:27b (hoặc qwen2.5:27b / qwen2.5:3b)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Gõ <code>ollama list</code> trong terminal để xem chính xác tên thẻ mô hình bạn đã tải về.
                </p>
              </div>

              {/* Critical CORS Note */}
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bật CORS Để Web App Không Bị Chặn (Quan Trọng):</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  Mặc định Ollama chặn yêu cầu từ trình duyệt. Hãy khởi động Ollama kèm cờ cho phép:
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-amber-200 text-slate-800 flex items-center justify-between">
                    <span>PowerShell: $env:OLLAMA_ORIGINS="*" ; ollama serve</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('$env:OLLAMA_ORIGINS="*" ; ollama serve', 'ollama_ps')}
                      className="text-amber-700 hover:text-amber-900 cursor-pointer ml-2"
                    >
                      {copiedKey === 'ollama_ps' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-amber-200 text-slate-800 flex items-center justify-between">
                    <span>macOS/Linux: OLLAMA_ORIGINS="*" ollama serve</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('OLLAMA_ORIGINS="*" ollama serve', 'ollama_sh')}
                      className="text-amber-700 hover:text-amber-900 cursor-pointer ml-2"
                    >
                      {copiedKey === 'ollama_sh' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: vLLM */}
          {activeTab === 'vllm' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Cấu Hình vLLM OpenAI Server (Độ Trễ Thấp Nhất Cho GPU Nvidia):
                </span>
                <p className="text-[11px] text-slate-600">
                  • <strong>URL Endpoint:</strong> <code>http://localhost:8000/v1</code><br />
                  • <strong>Lệnh chạy server vLLM:</strong>
                </p>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
{`python3 -m vllm.entrypoints.openai.api_server \\
  --model Qwen/Qwen2.5-3B-Instruct \\
  --port 8000 \\
  --trust-remote-code`}
                </pre>
              </div>
            </div>
          )}

          {/* Checklist / Quick Troubleshooting */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Các Bước Kiểm Tra Khi Không Thấy Phản Hồi:</span>
            </h4>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 leading-relaxed">
              <li>Đảm bảo LM Studio hoặc Ollama đang hiển thị trạng thái <strong>Running / Online</strong>.</li>
              <li>Mô hình đã được tải hoàn tất vào VRAM/RAM (Ready trong giao diện LM Studio).</li>
              <li>Bấm nút <strong>"⚡ Kiểm tra kết nối"</strong> trong menu Option để đo Ping mili-giây thực tế.</li>
              <li>Cả 2 bài tập đàm thoại tự do và chấm điểm phát âm ICAO sẽ tự động chuyển sang mô hình nội bộ của bạn.</li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Tương thích: LM Studio 0.3+, Ollama 0.3+, vLLM, Text-Gen WebUI
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs ml-auto"
          >
            Đóng Hướng Dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
