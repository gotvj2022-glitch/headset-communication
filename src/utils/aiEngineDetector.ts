import { LocalAiConfig } from '../types';

export const DEFAULT_LMSTUDIO_API_KEY = 'lms-sk-mogsZrILq30R1EUfjaGjo7Xt6kUDfZ-_psT61ZErzYA';

export interface DetectionResult {
  preferredEngine: 'local' | 'cloud';
  provider?: 'docker' | 'lmstudio' | 'ollama' | 'vllm';
  endpoint?: string;
  model?: string;
  apiKey?: string;
  latencyMs?: number;
  modelsFound?: string[];
  message: string;
}

/**
 * Probes local AI servers (Docker Suite, LM Studio & Ollama) upon login or manual trigger.
 * If a local server is responsive and online, prioritizes Local AI for zero-cloud latency.
 * Otherwise, seamlessly defaults to Gemini 3.1 Flash Lite cloud API for maximum speed.
 */
export async function detectBestAiEngine(currentConfig?: LocalAiConfig): Promise<DetectionResult> {
  const defaultKey = currentConfig?.apiKey || DEFAULT_LMSTUDIO_API_KEY;

  // Candidate 0: Docker Offline Suite (Faster-Whisper on 8000, LocalAI on 8081)
  const dockerStartTime = Date.now();
  try {
    const whisperCheck = fetch('http://localhost:8000/v1/models', { signal: AbortSignal.timeout(1200) }).catch(() => null);
    const localAiCheck = fetch('http://localhost:8081/v1/models', { signal: AbortSignal.timeout(1200) }).catch(() => null);
    const [wResp, lResp] = await Promise.all([whisperCheck, localAiCheck]);

    if ((wResp && (wResp.ok || wResp.status === 404)) || (lResp && lResp.ok)) {
      const latencyMs = Date.now() - dockerStartTime;
      return {
        preferredEngine: 'local',
        provider: 'docker',
        endpoint: 'http://localhost:8081/v1',
        model: 'localai',
        apiKey: '',
        latencyMs,
        message: `Phát hiện Docker Offline Suite (Faster-Whisper :8000 + LocalAI :8081) đang chạy! Đã tự động kích hoạt chế độ Offline siêu tốc (${latencyMs}ms).`,
      };
    }
  } catch {
    // Docker offline probe
  }

  // Candidate 1: LM Studio (Port 1234)
  const lmsEndpoint = 'http://localhost:1234/v1';
  const lmsStartTime = Date.now();
  try {
    const lmsResp = await fetch(`${lmsEndpoint}/models`, {
      method: 'GET',
      headers: defaultKey ? { Authorization: `Bearer ${defaultKey}` } : {},
      signal: AbortSignal.timeout(1800),
    });

    if (lmsResp.ok) {
      const data: any = await lmsResp.json();
      let models: string[] = [];
      if (Array.isArray(data.data)) {
        models = data.data.map((m: any) => m.id || m.name || String(m));
      } else if (Array.isArray(data.models)) {
        models = data.models.map((m: any) => m.name || m.id || String(m));
      }

      const latencyMs = Date.now() - lmsStartTime;
      const selectedModel =
        models.find((m) => m.includes('gemma')) ||
        models.find((m) => m.includes('qwen')) ||
        (models.length > 0 ? models[0] : 'google/gemma-4-e4b');

      return {
        preferredEngine: 'local',
        provider: 'lmstudio',
        endpoint: lmsEndpoint,
        model: selectedModel,
        apiKey: defaultKey,
        latencyMs,
        modelsFound: models,
        message: `Phát hiện LM Studio đang chạy trên máy bạn (${selectedModel}, độ trễ ${latencyMs}ms). Tự động ưu tiên xử lý nội bộ!`,
      };
    }
  } catch {
    // LM Studio not responding or CORS blocked
  }

  // Candidate 2: Ollama (Port 11434)
  const ollamaEndpoint = 'http://localhost:11434/v1';
  const ollamaStartTime = Date.now();
  try {
    const ollamaResp = await fetch(`${ollamaEndpoint}/models`, {
      method: 'GET',
      signal: AbortSignal.timeout(1800),
    });

    if (ollamaResp.ok) {
      const data: any = await ollamaResp.json();
      let models: string[] = [];
      if (Array.isArray(data.data)) {
        models = data.data.map((m: any) => m.id || m.name || String(m));
      } else if (Array.isArray(data.models)) {
        models = data.models.map((m: any) => m.name || m.id || String(m));
      }

      const latencyMs = Date.now() - ollamaStartTime;
      const selectedModel =
        models.find((m) => m.includes('qwen')) ||
        (models.length > 0 ? models[0] : 'qwen3.8:27b');

      return {
        preferredEngine: 'local',
        provider: 'ollama',
        endpoint: ollamaEndpoint,
        model: selectedModel,
        apiKey: '',
        latencyMs,
        modelsFound: models,
        message: `Phát hiện Ollama đang chạy trên máy bạn (${selectedModel}, độ trễ ${latencyMs}ms). Tự động ưu tiên xử lý nội bộ!`,
      };
    }
  } catch {
    // Ollama not responding
  }

  // Fallback: Gemini Cloud API
  return {
    preferredEngine: 'cloud',
    message: 'Máy chủ Local AI chưa mở. Tự động ưu tiên Gemini 3.1 Flash Lite đám mây siêu tốc!',
  };
}
