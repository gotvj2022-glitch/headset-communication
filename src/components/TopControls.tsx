import React, { useState } from 'react';
import { SCENARIOS, Scenario } from '../data/scenarios';
import { UserRole, PracticeMode, StudentLevel, LocalAiConfig, LocalAiProvider } from '../types';
import {
  SlidersHorizontal,
  Activity,
  X,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Plane,
  Wrench,
  Sparkles,
  GraduationCap,
  ClipboardCheck,
  BookCheck,
  CheckCircle2,
  Info,
  ChevronDown,
  Server,
  Cpu,
  Zap,
  Loader2,
  Terminal,
  Check,
  BookOpen
} from 'lucide-react';
import { LocalAiGuideModal } from './LocalAiGuideModal';
import { DEFAULT_LMSTUDIO_API_KEY } from '../utils/aiEngineDetector';

interface TopControlsProps {
  selectedScenario: Scenario;
  onSelectScenario: (scenario: Scenario) => void;
  practiceMode: PracticeMode;
  onTogglePracticeMode: (mode: PracticeMode) => void;
  studentLevel: StudentLevel;
  onChangeStudentLevel: (level: StudentLevel) => void;
  userRole: UserRole;
  onToggleUserRole: (role: UserRole) => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  karaokeEnabled: boolean;
  onToggleKaraoke: () => void;
  currentPairIndex: number;
  totalPairs: number;
  showDetailedEvaluation: boolean;
  onToggleDetailedEvaluation: () => void;
  localAiConfig: LocalAiConfig;
  onUpdateLocalAiConfig: (config: LocalAiConfig) => void;
}

export const TopControls: React.FC<TopControlsProps> = ({
  selectedScenario,
  onSelectScenario,
  practiceMode,
  onTogglePracticeMode,
  studentLevel,
  onChangeStudentLevel,
  userRole,
  onToggleUserRole,
  voiceEnabled,
  onToggleVoice,
  karaokeEnabled,
  onToggleKaraoke,
  currentPairIndex,
  totalPairs,
  showDetailedEvaluation,
  onToggleDetailedEvaluation,
  localAiConfig,
  onUpdateLocalAiConfig,
}) => {
  const [activePanel, setActivePanel] = useState<'option' | 'status' | null>(null);
  const [isLocalAiGuideOpen, setIsLocalAiGuideOpen] = useState<boolean>(false);
  const [isTestingLocalAi, setIsTestingLocalAi] = useState<boolean>(false);
  const [localAiTestResult, setLocalAiTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    error?: string;
    models?: string[];
  } | null>(null);

  const testLocalAiConnection = async () => {
    setIsTestingLocalAi(true);
    setLocalAiTestResult(null);
    const startTime = Date.now();

    // Step 1: Attempt direct client-side fetch from user's browser to local server
    try {
      const baseEndpoint = (localAiConfig.endpoint || 'http://localhost:1234/v1').trim().replace(/\/+$/, '');
      const modelsUrl = baseEndpoint.endsWith('/v1') ? `${baseEndpoint}/models` : `${baseEndpoint}/v1/models`;

      const directResp = await fetch(modelsUrl, {
        method: 'GET',
        headers: localAiConfig.apiKey ? { Authorization: `Bearer ${localAiConfig.apiKey}` } : {},
        signal: AbortSignal.timeout(2500),
      });

      if (directResp.ok) {
        const directData: any = await directResp.json();
        let models: string[] = [];
        if (Array.isArray(directData.data)) {
          models = directData.data.map((m: any) => m.id || m.name || String(m));
        } else if (Array.isArray(directData.models)) {
          models = directData.models.map((m: any) => m.name || m.id || String(m));
        }
        const latencyMs = Date.now() - startTime;
        setLocalAiTestResult({
          success: true,
          latencyMs,
          models: models.length > 0 ? models : [localAiConfig.model],
          message: `Kết nối trực tiếp tới máy chủ Local (${baseEndpoint}) thành công! (Độ trễ: ${latencyMs}ms)`,
        });
        setIsTestingLocalAi(false);
        return;
      }
    } catch {
      // Direct client fetch failed or CORS restricted, proceed to backend proxy test
    }

    // Step 2: Backend proxy test
    try {
      const resp = await fetch('/api/test-local-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: localAiConfig.endpoint,
          model: localAiConfig.model,
          apiKey: localAiConfig.apiKey,
        }),
      });
      const data = await resp.json();
      setLocalAiTestResult(data);
    } catch (err: any) {
      setLocalAiTestResult({
        success: false,
        error: err?.message || 'Không thể kết nối tới server Local AI.',
      });
    } finally {
      setIsTestingLocalAi(false);
    }
  };

  const applyLocalPreset = (provider: LocalAiProvider | 'qwen27b' | 'lmstudio_gemma') => {
    if (provider === 'lmstudio_gemma' || provider === 'lmstudio') {
      onUpdateLocalAiConfig({
        ...localAiConfig,
        enabled: true,
        provider: 'lmstudio',
        endpoint: 'http://localhost:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: localAiConfig.apiKey || DEFAULT_LMSTUDIO_API_KEY,
      });
      setLocalAiTestResult(null);
      return;
    }

    if (provider === 'qwen27b') {
      onUpdateLocalAiConfig({
        ...localAiConfig,
        enabled: true,
        provider: 'ollama',
        endpoint: 'http://localhost:11434/v1',
        model: 'qwen3.8:27b',
      });
      setLocalAiTestResult(null);
      return;
    }

    switch (provider) {
      case 'ollama':
        onUpdateLocalAiConfig({
          ...localAiConfig,
          enabled: true,
          provider: 'ollama',
          endpoint: 'http://localhost:11434/v1',
          model: 'qwen2.5:3b',
        });
        break;
      case 'vllm':
        onUpdateLocalAiConfig({
          ...localAiConfig,
          enabled: true,
          provider: 'vllm',
          endpoint: 'http://localhost:8000/v1',
          model: 'Qwen/Qwen2.5-3B-Instruct',
        });
        break;
      case 'custom':
        onUpdateLocalAiConfig({
          ...localAiConfig,
          enabled: true,
          provider: 'custom',
          endpoint: localAiConfig.endpoint || 'http://localhost:1234/v1',
        });
        break;
    }
    setLocalAiTestResult(null);
  };

  const getModeLabel = () => {
    switch (practiceMode) {
      case 'scenario':
        return 'Kịch bản chuẩn (10 câu)';
      case 'free':
        return 'Đối thoại tự do';
      case 'exam':
        return 'Kiểm tra quá trình (Thang 100)';
    }
  };

  const getLevelLabel = () => {
    switch (studentLevel) {
      case 'beginner':
        return 'Mức 1: Cơ bản (>30% đạt)';
      case 'intermediate':
        return 'Mức 2: Tiêu chuẩn (>50% đạt)';
      case 'advanced':
        return 'Mức 3: Đạt chuẩn đầu ra (>70% đạt)';
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 text-slate-800 shadow-2xs shrink-0 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* The 2 Primary Control Groups: Option & Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Group 1: OPTION Button */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'option' ? null : 'option')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              activePanel === 'option'
                ? 'bg-red-600 text-white ring-2 ring-red-400/40 shadow-red-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-300/80 hover:border-red-300'
            }`}
            title="Bấm để mở cài đặt Tùy chọn (Chế độ, Tình huống, Cấp độ, Vai trò)"
          >
            <SlidersHorizontal className="w-4 h-4 text-red-600" style={{ color: activePanel === 'option' ? 'white' : undefined }} />
            <span>Option (Tùy chọn)</span>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-white/20 text-current border border-current/20">
              {userRole === 'Ground' ? 'Headset Man' : 'Phi công'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activePanel === 'option' ? 'rotate-180' : ''}`} />
          </button>

          {/* Group 2: STATUS Button */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'status' ? null : 'status')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              activePanel === 'status'
                ? 'bg-amber-500 text-white ring-2 ring-amber-400/40 shadow-amber-500/20'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-300/80 hover:border-amber-300'
            }`}
            title="Bấm để xem Trạng thái (Tàu bay, Bãi đỗ, Tiến độ, Quy chuẩn VIAA)"
          >
            <Activity className="w-4 h-4 text-amber-600" style={{ color: activePanel === 'status' ? 'white' : undefined }} />
            <span>Status (Trạng thái)</span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-white/20 text-current border border-current/20">
              {selectedScenario.flight} · {currentPairIndex}/{totalPairs}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activePanel === 'status' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Quick Ambient Badges on Right */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Current Mode Badge */}
          <span className="hidden lg:inline-flex items-center gap-1.5 font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>{getModeLabel()}</span>
          </span>

          {/* Voice status quick toggle */}
          <button
            type="button"
            onClick={onToggleVoice}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
            }`}
            title={voiceEnabled ? 'Giọng đọc AI: Đang Bật' : 'Giọng đọc AI: Đang Tắt'}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Voice:</span>
            <span>{voiceEnabled ? 'Bật' : 'Tắt'}</span>
          </button>

          {/* Local AI Guide & Status Quick Launcher */}
          <button
            type="button"
            onClick={() => setIsLocalAiGuideOpen(true)}
            className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              localAiConfig.enabled
                ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Mở bảng hướng dẫn URL Endpoint, Model Name và Header kết nối Local AI"
          >
            <Server className={`w-3.5 h-3.5 ${localAiConfig.enabled ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="hidden md:inline">Local AI:</span>
            <span>{localAiConfig.enabled ? (localAiConfig.provider === 'lmstudio' ? 'LM Studio' : 'Ollama') : 'Guide'}</span>
          </button>

          {/* Turn Counter Pill */}
          {practiceMode !== 'free' && (
            <div className="px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg font-mono font-bold text-slate-800">
              <span className="text-red-600">{currentPairIndex}</span>/{totalPairs}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP PANEL 1: OPTION (Tùy chọn điều khiển) */}
      {/* ========================================================================= */}
      {activePanel === 'option' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-slate-900/35 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop dismissal */}
          <div className="absolute inset-0" onClick={() => setActivePanel(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden z-10 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Bảng Tùy Chọn Điều Khiển (Option)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấu hình chế độ học, tình huống, cấp độ và vai trò đàm thoại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 1. Chế độ học (3 Tabs) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <BookCheck className="w-3.5 h-3.5 text-red-600" />
                  <span>1. Chế độ huấn luyện & thi</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onTogglePracticeMode('scenario')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      practiceMode === 'scenario'
                        ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 mb-0.5">
                      <BookCheck className="w-3.5 h-3.5 text-red-600" />
                      <span>Kịch bản chuẩn</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      10 cặp đối đáp theo quy trình chuẩn
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTogglePracticeMode('free')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      practiceMode === 'free'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 mb-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đối thoại tự do</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Phản xạ linh hoạt cùng AI theo vai
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTogglePracticeMode('exam')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      practiceMode === 'exam'
                        ? 'bg-gradient-to-r from-red-50 to-amber-50 border-red-500 text-red-900 ring-2 ring-red-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5 mb-0.5">
                      <ClipboardCheck className="w-3.5 h-3.5 text-red-600" />
                      <span>Kiểm tra quá trình</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Chấm điểm thang 100, bám sát mục tiêu
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Cấp độ học viên */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-red-600" />
                  <span>2. Cấp độ đánh giá học viên VIAA</span>
                </label>
                <select
                  value={studentLevel}
                  onChange={(e) => onChangeStudentLevel(e.target.value as StudentLevel)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-red-400 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="beginner">Mức 1: Cơ bản (hỗ trợ Lời thoại nhắc nhở, &gt; 30% là đạt)</option>
                  <option value="intermediate">Mức 2: Tiêu chuẩn huấn luyện (&gt; 50% là đạt)</option>
                  <option value="advanced">Mức 3: Đạt chuẩn đầu ra (&gt; 70% là đạt)</option>
                </select>
              </div>

              {/* 3. Tình huống đàm thoại */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-red-600" />
                  <span>3. Tình huống bài học (10 kịch bản tiêu chuẩn)</span>
                </label>
                <select
                  value={selectedScenario.id}
                  onChange={(e) => {
                    const found = SCENARIOS.find((s) => s.id === e.target.value);
                    if (found) onSelectScenario(found);
                  }}
                  disabled={practiceMode === 'free'}
                  className={`w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:border-red-500 ${
                    practiceMode === 'free' ? 'opacity-40 cursor-not-allowed bg-slate-100' : 'hover:border-slate-400'
                  }`}
                >
                  <optgroup label="Chương 1: Quy trình Đẩy & Kéo Tàu Bay">
                    {SCENARIOS.filter((s) => s.chapter === 1).map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.difficulty}] {s.title} ({s.aircraft})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Chương 2: Các Hình Thức Đàm Thoại Với Tổ Bay">
                    {SCENARIOS.filter((s) => s.chapter === 2).map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.difficulty}] {s.title} ({s.aircraft})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Chương 3: Quy Trình Phục Vụ Mặt Đất">
                    {SCENARIOS.filter((s) => s.chapter === 3).map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.difficulty}] {s.title} ({s.aircraft})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Chương 4: An Toàn Trong Khai Thác Mặt Đất">
                    {SCENARIOS.filter((s) => s.chapter === 4).map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.difficulty}] {s.title} ({s.aircraft})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Chương 5: Tín Hiệu & Thuật Ngữ Chuẩn">
                    {SCENARIOS.filter((s) => s.chapter === 5).map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.difficulty}] {s.title} ({s.aircraft})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* 4. Vai trò học viên */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-red-600" />
                  <span>4. Vai trò thực hành</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleUserRole('Ground')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      userRole === 'Ground'
                        ? 'bg-red-600 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Headset Man (Thợ máy)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleUserRole('Cockpit')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      userRole === 'Cockpit'
                        ? 'bg-amber-500 text-white font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                    <span>Phi công (Cockpit)</span>
                  </button>
                </div>
              </div>

              {/* 5. Trợ năng tương tác */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-red-600" />
                  <span>5. Trợ năng tương tác</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={onToggleVoice}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                      voiceEnabled
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
                    <span>Giọng nói AI: {voiceEnabled ? 'Đang Bật' : 'Đang Tắt'}</span>
                  </button>

                  {practiceMode !== 'exam' ? (
                    <button
                      type="button"
                      onClick={onToggleKaraoke}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                        karaokeEnabled
                          ? 'bg-red-50 border-red-300 text-red-800'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {karaokeEnabled ? <Eye className="w-4 h-4 text-red-600" /> : <EyeOff className="w-4 h-4" />}
                      <span>Lời thoại nhắc nhở: {karaokeEnabled ? 'Đang Bật' : 'Đang Ẩn'}</span>
                    </button>
                  ) : (
                    <span className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 border border-amber-300 text-amber-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span>Chế độ kiểm tra: Khóa ẩn lời thoại</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 6. Chế độ Đánh Giá Nhanh (Bật / Tắt nhận xét chi tiết) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>6. Chế độ "Đánh giá nhanh" đối thoại</span>
                  </label>
                  <button
                    type="button"
                    onClick={onToggleDetailedEvaluation}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      !showDetailedEvaluation ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                    title={!showDetailedEvaluation ? 'Đang Bật Đánh giá nhanh' : 'Đang Tắt Đánh giá nhanh (hiện chi tiết)'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        !showDetailedEvaluation ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!showDetailedEvaluation) onToggleDetailedEvaluation();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      showDetailedEvaluation
                        ? 'bg-red-50 border-red-500 text-red-900 ring-2 ring-red-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đánh giá chi tiết (Đầy đủ)
                      </span>
                      {showDetailedEvaluation && <Check className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      Hiện đầy đủ điểm số, lỗi từ vựng, nhận xét chuẩn ICAO và bóng đèn gợi ý nghiệp vụ hàng không.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (showDetailedEvaluation) onToggleDetailedEvaluation();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !showDetailedEvaluation
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        Đánh giá nhanh (Gọn nhẹ)
                      </span>
                      {!showDetailedEvaluation && <Check className="w-3.5 h-3.5 text-amber-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                      Ẩn phần nhận xét dài dòng, chỉ hiện điểm số badge (ví dụ: 95/100 ĐIỂM) để màn hình thanh thoát.
                    </p>
                  </button>
                </div>

                {/* Visual Preview of what gets toggled */}
                <div className="mt-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>Mẫu nội dung sẽ được ẩn/hiện:</span>
                    <span className="font-mono text-[10px] text-amber-700 bg-amber-100/60 px-1.5 py-0.5 rounded">
                      {!showDetailedEvaluation ? '⚡ Đang ẩn trong bong bóng chat' : '👁️ Đang hiển thị đầy đủ'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-[11px] font-mono leading-relaxed text-slate-700">
                    <span className="text-emerald-700 font-bold">✓ Mức Tốt: Phát âm chuẩn xác, khẩu lệnh rõ ràng theo tiêu chuẩn ICAO.</span><br />
                    <span className="text-slate-600 italic">💡 Bạn đã thực hiện đúng quy trình liên lạc giữa mặt đất và buồng lái. Phát âm rõ ràng, thuật ngữ chính xác, đạt yêu cầu tiêu chuẩn hàng không.</span>
                  </div>
                </div>
              </div>

              {/* 7. Cấu hình Local AI (LLMs Máy tính cá nhân) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-slate-800 text-white flex items-center justify-center">
                      <Server className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        7. Sử dụng AI Local (LLMs Máy tính cá nhân)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Kết nối Ollama, vLLM hoặc LM Studio trên máy của bạn để có độ trễ thấp nhất
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLocalAiGuideOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Xem hướng dẫn chi tiết URL Endpoint, Model, Header và Payload JSON"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Hướng Dẫn Cấu Hình (Guide)</span>
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localAiConfig.enabled}
                        onChange={(e) =>
                          onUpdateLocalAiConfig({
                            ...localAiConfig,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>

                {localAiConfig.enabled && (
                  <div className="mt-3 p-3.5 bg-slate-50 border border-slate-300 rounded-2xl space-y-3 animate-fadeIn">
                    {/* Presets */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                        <span>Chọn máy chủ cục bộ nhanh:</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                          Hỗ trợ Qwen 27B, Ollama, LM Studio, vLLM
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* LM Studio Gemma (User's active local model) */}
                        <button
                          type="button"
                          onClick={() => applyLocalPreset('lmstudio')}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            localAiConfig.provider === 'lmstudio' && localAiConfig.model.includes('gemma')
                              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-red-500 ring-2 ring-amber-400/30'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:bg-emerald-100'
                          }`}
                          title="LM Studio đang chạy: google/gemma-4-e4b (Cổng 1234)"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>LM Studio (Gemma)</span>
                          </div>
                          <div className="text-[10px] font-mono opacity-85 mt-0.5">
                            Port 1234 · gemma-4-e4b
                          </div>
                        </button>

                        {/* Qwen 27B */}
                        <button
                          type="button"
                          onClick={() => applyLocalPreset('qwen27b')}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            localAiConfig.model === 'qwen3.8:27b'
                              ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>🔥 Qwen 27B Local</div>
                          <div className="text-[10px] font-mono opacity-70 mt-0.5">Port 11434</div>
                        </button>

                        {/* Ollama 3B */}
                        <button
                          type="button"
                          onClick={() => applyLocalPreset('ollama')}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            localAiConfig.provider === 'ollama' && localAiConfig.model !== 'qwen3.8:27b'
                              ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>⭐ Ollama 3B</div>
                          <div className="text-[10px] font-mono opacity-70 mt-0.5">Port 11434</div>
                        </button>

                        {/* vLLM */}
                        <button
                          type="button"
                          onClick={() => applyLocalPreset('vllm')}
                          className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer shadow-xs ${
                            localAiConfig.provider === 'vllm'
                              ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/30'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div>vLLM High-Speed</div>
                          <div className="text-[10px] font-mono opacity-70 mt-0.5">Port 8000</div>
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                          URL Endpoint Máy chủ Local:
                        </label>
                        <input
                          type="text"
                          value={localAiConfig.endpoint}
                          onChange={(e) =>
                            onUpdateLocalAiConfig({
                              ...localAiConfig,
                              endpoint: e.target.value,
                            })
                          }
                          placeholder="http://localhost:1234/v1"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          LM Studio mặc định: <strong className="text-emerald-700">http://localhost:1234/v1</strong>
                        </span>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                          Tên Mô hình (Model Name):
                        </label>
                        <input
                          type="text"
                          value={localAiConfig.model}
                          onChange={(e) =>
                            onUpdateLocalAiConfig({
                              ...localAiConfig,
                              model: e.target.value,
                            })
                          }
                          placeholder="google/gemma-4-e4b"
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                        />
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium">Chọn nhanh:</span>
                          {['google/gemma-4-e4b', 'google/gemma-4-e4b:2', 'qwen3.8:27b', 'qwen2.5:27b', 'qwen2.5:3b'].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => onUpdateLocalAiConfig({ ...localAiConfig, model: m })}
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                localAiConfig.model === m
                                  ? 'bg-red-600 text-white font-bold'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <div className="flex-1">
                        <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                          API Key (Tùy chọn nếu server yêu cầu auth):
                        </label>
                        <input
                          type="password"
                          value={localAiConfig.apiKey || ''}
                          onChange={(e) =>
                            onUpdateLocalAiConfig({
                              ...localAiConfig,
                              apiKey: e.target.value,
                            })
                          }
                          placeholder={DEFAULT_LMSTUDIO_API_KEY}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      </div>

                      <div className="shrink-0 self-end flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsLocalAiGuideOpen(true)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Xem định dạng Header HTTP và JSON Payload gửi tới mô hình"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                          <span className="hidden sm:inline">Mẫu Header & Payload</span>
                          <span className="sm:hidden">Guide</span>
                        </button>

                        <button
                          type="button"
                          onClick={testLocalAiConnection}
                          disabled={isTestingLocalAi}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {isTestingLocalAi ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                              <span>Đang ping server...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>Kiểm tra kết nối</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Connection Test Result Badge */}
                    {localAiTestResult && (
                      <div
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                          localAiTestResult.success
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-red-50 border-red-300 text-red-900'
                        }`}
                      >
                        {localAiTestResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 flex-1">
                          <p className="font-bold">
                            {localAiTestResult.success
                              ? `🟢 Kết nối Local AI thành công! (Độ trễ: ${localAiTestResult.latencyMs}ms)`
                              : '🔴 Kết nối thất bại'}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            {localAiTestResult.message || localAiTestResult.error}
                          </p>
                          {localAiTestResult.models && localAiTestResult.models.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-emerald-200">
                              <span className="text-[10px] text-slate-700 font-bold block mb-1">
                                Danh sách mô hình tìm thấy trên máy (bấm để chọn):
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {localAiTestResult.models.map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => onUpdateLocalAiConfig({ ...localAiConfig, model: m })}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                      localAiConfig.model === m
                                        ? 'bg-emerald-700 text-white font-bold'
                                        : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Low Latency Recommendation Banner */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-3 text-[11px] space-y-1.5 text-slate-800">
                      <div className="font-bold flex items-center gap-1.5 text-amber-900">
                        <Terminal className="w-3.5 h-3.5 text-amber-700" />
                        <span>Bộ công cụ Local AI khuyên dùng cho độ trễ thấp nhất (&lt; 100ms):</span>
                      </div>
                      <div className="space-y-1 text-slate-700 leading-relaxed">
                        <p>
                          <strong>1. Engine:</strong> Dùng <strong>Ollama</strong> (tự động tối ưu GPU Nvidia CUDA hoặc Apple Silicon Metal).
                        </p>
                        <p>
                          <strong>2. Model:</strong> Dùng <strong>Qwen 2.5 (3B-Instruct)</strong>. Đây là model nhẹ nhất, phản hồi tiếng Việt & Anh siêu nhanh (80-120 token/s), xuất JSON chuẩn xác 100%.
                        </p>
                        <div className="bg-slate-900 text-emerald-400 p-2 rounded-lg font-mono text-[10px] flex items-center justify-between">
                          <span>$ ollama run qwen2.5:3b</span>
                          <span className="text-[9px] text-slate-400">1 lệnh là chạy ngay</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Các tùy chọn đã chọn sẽ áp dụng trực tiếp vào buổi huấn luyện.
              </span>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Áp dụng & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP PANEL 2: STATUS (Trạng thái khai thác & tiến độ) */}
      {/* ========================================================================= */}
      {activePanel === 'status' && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-slate-900/35 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop dismissal */}
          <div className="absolute inset-0" onClick={() => setActivePanel(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden z-10 animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Bảng Trạng Thái Khai Thác & Đánh Giá (Status)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chi tiết chuyến bay, vị trí đỗ, tiến độ và quy chuẩn điểm số VIAA
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 1. Thông tin tàu bay & bãi đỗ */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tàu bay & Chuyến bay:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-600 font-mono text-sm">{selectedScenario.aircraft}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-black text-slate-900 font-mono text-sm">{selectedScenario.flight}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Vị trí bãi đỗ:
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    {selectedScenario.location}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Điều kiện khai thác:
                  </span>
                  <span className="text-xs font-medium text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    {selectedScenario.conditions}
                  </span>
                </div>
              </div>

              {/* 2. Tiến độ đàm thoại */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>Tiến độ đàm thoại:</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-amber-900">
                    Cặp {currentPairIndex} / {totalPairs} (Còn lại {Math.max(0, totalPairs - currentPairIndex)} câu)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-amber-200/80 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((currentPairIndex / totalPairs) * 100))}%` }}
                  />
                </div>
              </div>

              {/* 3. Quy chuẩn đánh giá học viên VIAA theo từng mức */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Quy chuẩn đánh giá phân cấp học viên VIAA</span>
                </span>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    studentLevel === 'beginner' ? 'bg-red-50 border-red-300 text-red-950 font-bold ring-1 ring-red-400' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                    <div>
                      <span className="font-bold text-slate-900 block">Mức 1: Cơ bản</span>
                      <span className="text-[11px] text-slate-600 block">
                        Hỗ trợ Lời thoại nhắc nhở tiếng Việt & gợi ý mẫu câu. <strong>Chỉ cần trên 30%</strong> là đạt và qua câu tiếp theo.
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    studentLevel === 'intermediate' ? 'bg-red-50 border-red-300 text-red-950 font-bold ring-1 ring-red-400' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5"></span>
                    <div>
                      <span className="font-bold text-slate-900 block">Mức 2: Tiêu chuẩn huấn luyện</span>
                      <span className="text-[11px] text-slate-600 block">
                        Quy trình chuẩn kỹ thuật viên hàng không. <strong>Điểm trên 50%</strong> là đạt và qua câu tiếp theo.
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    studentLevel === 'advanced' ? 'bg-red-50 border-red-300 text-red-950 font-bold ring-1 ring-red-400' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5"></span>
                    <div>
                      <span className="font-bold text-slate-900 block">Mức 3: Đạt chuẩn đầu ra</span>
                      <span className="text-[11px] text-slate-600 block">
                        Sát hạch chuẩn đầu ra khắt khe. <strong>Điểm trên 70%</strong> là đạt và qua câu tiếp theo.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Học viên đạt điểm trên ngưỡng quy định của mức đã chọn sẽ tự động chuyển sang lượt đối đáp kế tiếp.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Guide Modal for LM Studio & Ollama */}
      <LocalAiGuideModal
        isOpen={isLocalAiGuideOpen}
        onClose={() => setIsLocalAiGuideOpen(false)}
        currentConfig={localAiConfig}
        onApplyConfig={onUpdateLocalAiConfig}
      />
    </div>
  );
};
