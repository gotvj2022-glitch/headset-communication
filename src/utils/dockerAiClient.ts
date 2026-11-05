/**
 * Docker Offline AI Client
 * Connects directly to local Docker containers:
 * - Faster-Whisper (Port 8000): fedirz/faster-whisper-server:latest-cpu (OpenAI STT format)
 * - LocalAI (Port 8081): localai/localai:latest-aio-cpu (OpenAI TTS & LLM Chat format)
 */

export interface DockerServicesStatus {
  whisper: {
    online: boolean;
    endpoint: string;
    latencyMs?: number;
    error?: string;
  };
  localAi: {
    online: boolean;
    endpoint: string;
    latencyMs?: number;
    models?: string[];
    error?: string;
  };
  allOnline: boolean;
}

/**
 * Ping test both Faster-Whisper (:8000) and LocalAI (:8081)
 */
export async function testDockerServices(
  whisperEndpoint: string = 'http://localhost:8000/v1',
  localAiEndpoint: string = 'http://localhost:8081/v1'
): Promise<DockerServicesStatus> {
  const result: DockerServicesStatus = {
    whisper: { online: false, endpoint: whisperEndpoint },
    localAi: { online: false, endpoint: localAiEndpoint },
    allOnline: false,
  };

  // 1. Test Faster-Whisper (Port 8000)
  const cleanWhisper = whisperEndpoint.trim().replace(/\/+$/, '');
  const whisperStartTime = Date.now();
  try {
    // faster-whisper-server provides /v1/models or root
    const modelsUrl = cleanWhisper.endsWith('/v1') ? `${cleanWhisper}/models` : `${cleanWhisper}/v1/models`;
    const resp = await fetch(modelsUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    });
    if (resp.ok || resp.status === 404 || resp.status === 405) {
      result.whisper.online = true;
      result.whisper.latencyMs = Date.now() - whisperStartTime;
    } else {
      result.whisper.error = `HTTP ${resp.status}`;
    }
  } catch (err: any) {
    // Attempt fallback via backend proxy
    try {
      const proxyResp = await fetch('/api/test-docker-whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: cleanWhisper }),
        signal: AbortSignal.timeout(3000),
      });
      const proxyData = await proxyResp.json();
      if (proxyData.success) {
        result.whisper.online = true;
        result.whisper.latencyMs = proxyData.latencyMs || (Date.now() - whisperStartTime);
      } else {
        result.whisper.error = proxyData.error || err.message;
      }
    } catch {
      result.whisper.error = err?.message || 'Không thể kết nối tới Faster-Whisper';
    }
  }

  // 2. Test LocalAI (Port 8081)
  const cleanLocalAi = localAiEndpoint.trim().replace(/\/+$/, '');
  const localAiStartTime = Date.now();
  try {
    const modelsUrl = cleanLocalAi.endsWith('/v1') ? `${cleanLocalAi}/models` : `${cleanLocalAi}/v1/models`;
    const resp = await fetch(modelsUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    });
    if (resp.ok) {
      const data: any = await resp.json();
      result.localAi.online = true;
      result.localAi.latencyMs = Date.now() - localAiStartTime;
      if (Array.isArray(data.data)) {
        result.localAi.models = data.data.map((m: any) => m.id || m.name || String(m));
      }
    } else {
      result.localAi.error = `HTTP ${resp.status}`;
    }
  } catch (err: any) {
    // Attempt fallback via backend proxy
    try {
      const proxyResp = await fetch('/api/test-docker-localai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: cleanLocalAi }),
        signal: AbortSignal.timeout(3000),
      });
      const proxyData = await proxyResp.json();
      if (proxyData.success) {
        result.localAi.online = true;
        result.localAi.latencyMs = proxyData.latencyMs || (Date.now() - localAiStartTime);
        result.localAi.models = proxyData.models;
      } else {
        result.localAi.error = proxyData.error || err.message;
      }
    } catch {
      result.localAi.error = err?.message || 'Không thể kết nối tới LocalAI';
    }
  }

  result.allOnline = result.whisper.online && result.localAi.online;
  return result;
}

/**
 * Transcribe Audio using local Faster-Whisper (:8000)
 */
export async function transcribeWithFasterWhisper(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  whisperEndpoint: string = 'http://localhost:8000/v1',
  model: string = 'Systran/faster-whisper-small'
): Promise<{ text: string; latencyMs: number }> {
  const startTime = Date.now();
  const cleanEndpoint = whisperEndpoint.trim().replace(/\/+$/, '');
  const transcriptUrl = cleanEndpoint.endsWith('/audio/transcriptions')
    ? cleanEndpoint
    : cleanEndpoint.endsWith('/v1')
    ? `${cleanEndpoint}/audio/transcriptions`
    : `${cleanEndpoint}/v1/audio/transcriptions`;

  // Convert base64 to binary Blob
  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, 'speech.webm');
  formData.append('model', model || 'Systran/faster-whisper-small');
  formData.append('language', 'en');
  formData.append('response_format', 'json');

  try {
    // Try direct fetch first
    const resp = await fetch(transcriptUrl, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(6000),
    });

    if (resp.ok) {
      const data = await resp.json();
      const text = (data.text || '').trim();
      return { text, latencyMs: Date.now() - startTime };
    }
    throw new Error(`Faster-Whisper returned HTTP ${resp.status}`);
  } catch (directErr: any) {
    // If direct fetch fails (e.g. CORS), proxy through backend endpoint
    console.warn('[Docker Whisper Direct Failed - Trying Proxy]:', directErr?.message);
    const proxyResp = await fetch('/api/docker-whisper-transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType,
        endpoint: cleanEndpoint,
        model,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!proxyResp.ok) {
      const errText = await proxyResp.text();
      throw new Error(`Docker Whisper Proxy Error: ${errText}`);
    }

    const data = await proxyResp.json();
    return {
      text: (data.text || '').trim(),
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Synthesize Speech using LocalAI (:8081)
 */
export async function synthesizeWithLocalAiTts(
  text: string,
  speaker: 'Cockpit' | 'Ground' = 'Cockpit',
  localAiEndpoint: string = 'http://localhost:8081/v1',
  voice?: string
): Promise<{ audioBase64: string | null; latencyMs: number }> {
  const startTime = Date.now();
  const cleanEndpoint = localAiEndpoint.trim().replace(/\/+$/, '');
  const ttsUrl = cleanEndpoint.endsWith('/audio/speech')
    ? cleanEndpoint
    : cleanEndpoint.endsWith('/v1')
    ? `${cleanEndpoint}/audio/speech`
    : `${cleanEndpoint}/v1/audio/speech`;

  const selectedVoice = voice || (speaker === 'Ground' ? 'en-us-male' : 'en-us-female');

  try {
    const resp = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'wav',
      }),
      signal: AbortSignal.timeout(1500),
    });

    if (resp.ok) {
      const arrayBuffer = await resp.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(arrayBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);
      return { audioBase64, latencyMs: Date.now() - startTime };
    }
    throw new Error(`LocalAI TTS HTTP ${resp.status}`);
  } catch (directErr: any) {
    console.warn('[Docker LocalAI TTS Direct Failed - Trying Proxy]:', directErr?.message);
    try {
      const proxyResp = await fetch('/api/docker-localai-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speaker,
          endpoint: cleanEndpoint,
          voice: selectedVoice,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (proxyResp.ok) {
        const data = await proxyResp.json();
        return {
          audioBase64: data.audioBase64 || null,
          latencyMs: Date.now() - startTime,
        };
      }
    } catch {}
    return { audioBase64: null, latencyMs: Date.now() - startTime };
  }
}

export const DEFAULT_SERVER_LAN_IP = '172.30.115.239';

/**
 * Test connectivity to Open WebUI container (e.g. http://172.30.115.239:8090)
 */
export async function testOpenWebUiService(
  endpoint: string = 'http://172.30.115.239:8090/api',
  apiKey?: string
): Promise<{ online: boolean; latencyMs?: number; models?: string[]; error?: string; message?: string }> {
  const startTime = Date.now();
  const cleanEndpoint = (endpoint || 'http://172.30.115.239:8090/api').trim().replace(/\/+$/, '');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // Open WebUI routes:
  // - /api/models
  // - /api/v1/models
  // - /v1/models
  // - /models
  const candidateUrls: string[] = [];
  if (cleanEndpoint.endsWith('/api') || cleanEndpoint.endsWith('/v1') || cleanEndpoint.endsWith('/api/v1')) {
    candidateUrls.push(`${cleanEndpoint}/models`);
  } else {
    candidateUrls.push(`${cleanEndpoint}/api/models`);
    candidateUrls.push(`${cleanEndpoint}/v1/models`);
    candidateUrls.push(`${cleanEndpoint}/api/v1/models`);
  }

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3000),
      });

      if (resp.ok) {
        const latencyMs = Date.now() - startTime;
        let models: string[] = [];
        try {
          const data = await resp.json();
          if (Array.isArray(data.data)) {
            models = data.data.map((m: any) => m.id || m.name || String(m));
          } else if (Array.isArray(data.models)) {
            models = data.models.map((m: any) => m.name || m.id || String(m));
          }
        } catch {}
        return {
          online: true,
          latencyMs,
          models,
          message: `Open WebUI (:8090) đang hoạt động tốt (${latencyMs}ms, ${models.length} models)!`,
        };
      }

      if (resp.status === 401) {
        return {
          online: true,
          latencyMs: Date.now() - startTime,
          error: 'Open WebUI yêu cầu API Key. Vui lòng vào Open WebUI > Settings > Account > API Keys để tạo key và dán vào ô API Key.',
        };
      }
    } catch {
      // Continue next candidate URL
    }
  }

  return {
    online: false,
    error: `Không thể kết nối Open WebUI tại ${cleanEndpoint}. Đảm bảo máy chủ (172.30.115.239) đang mở container Open WebUI cổng 8090 và đã cho phép qua Windows Firewall.`,
  };
}

/**
 * Direct Client-Side Local AI Evaluation
 * Directly queries LocalAI (:8081) or Open WebUI (:8090) from the student's browser with 0 cloud latency.
 */
export async function evaluateWithLocalDocker(
  spokenText: string,
  expectedPhrase: string,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  localAiEndpoint: string = 'http://localhost:8081/v1',
  model: string = 'google/gemma-4-e4b',
  apiKey?: string
): Promise<any | null> {
  const cleanEndpoint = (localAiEndpoint || 'http://localhost:8081/v1').trim().replace(/\/+$/, '');
  let chatUrl: string;
  if (cleanEndpoint.endsWith('/chat/completions')) {
    chatUrl = cleanEndpoint;
  } else if (cleanEndpoint.endsWith('/api') || cleanEndpoint.endsWith('/v1') || cleanEndpoint.endsWith('/api/v1')) {
    chatUrl = `${cleanEndpoint}/chat/completions`;
  } else {
    chatUrl = `${cleanEndpoint}/v1/chat/completions`;
  }

  const passingThreshold = difficulty === 'easy' ? 30 : difficulty === 'hard' ? 70 : 50;

  try {
    const prompt = `You are an ICAO Aviation Radio Examiner at Victoria Aviation Academy (VIAA).
Target Standard ICAO Phrase: "${expectedPhrase}"
Student Transmission: "${spokenText}"
Difficulty: ${difficulty} (Pass threshold: > ${passingThreshold}%)

Evaluate the student transmission against the target ICAO phrase. Return JSON ONLY with this schema:
{
  "transcribedText": "${spokenText}",
  "overallScore": number (0-100),
  "pronunciationScore": number (0-100),
  "phraseologyScore": number (0-100),
  "feedbackSummary": string (Vietnamese, 1-2 sentences),
  "assistantReply": string
}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const resp = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model || 'google/gemma-4-e4b',
        messages: [
          { role: 'system', content: 'You are an ICAO aviation radio examiner. Return JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(2800),
    });

    if (resp.ok) {
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const cleanContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleanContent);
        return parsed;
      }
    }
  } catch {
    // Return null smoothly so cloud Gemini handles evaluation seamlessly
  }
  return null;
}
