import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { EvaluationGrade, MispronouncedWord } from './src/types';
import {
  normalizeForAviationMatching,
  computeAviationPhoneticSimilarity,
} from './src/utils/aviationPhonetics';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

let geminiQuotaExhaustedUntil = 0;

/**
 * Fast Text Evaluation Model: gemini-3.1-flash-lite
 * Optimized for low latency, bilingual (English & Vietnamese), and high throughput.
 */
const FAST_TEXT_MODEL = 'gemini-3.1-flash-lite';

/**
 * PART 3 — SERVER: GEMINI CALL WITH RETRY + MODEL FALLBACK (VIAA-GOT EXACT)
 * - models to try, in order, de-duplicated:
 *     [params.model === 'gemini-3.5-flash' ? 'gemini-3.1-flash-lite' : params.model,
 *      'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash']
 * - for each model, up to `retries` attempts: await ai.models.generateContent({ ...params, model }).
 * - error handling per attempt (status = Number(err.status || err.statusCode || 0), msg = lowercased message):
 *     * if status 503 or 429 or msg contains any of
 *       "503","429","quota","limit","rate","exhausted","unavailable","overloaded","high demand","resource_exhausted"
 *       -> break immediately and go to the NEXT model.
 *     * else if 400 <= status < 500, or msg contains "api_key","invalid key","unauthorized" -> throw (fatal).
 *     * else wait delay * 2^(attempt-1) ms and retry the same model.
 * - throw the last error if every model fails. Log model + attempt for each call.
 */
async function generateContentWithRetry(
  params: {
    model?: string;
    contents: any;
    config?: any;
    [key: string]: any;
  },
  retries = 3,
  delay = 1000
): Promise<any> {
  if (!ai) {
    throw new Error('Gemini API client is not initialized.');
  }

  if (Date.now() < geminiQuotaExhaustedUntil) {
    throw new Error('RESOURCE_EXHAUSTED: Gemini quota temporarily exhausted (circuit breaker active). Using fallback evaluation.');
  }

  const baseModel = params.model === 'gemini-3.5-flash' ? 'gemini-3.1-flash-lite' : params.model || 'gemini-3.1-flash-lite';
  const rawModels = [baseModel, 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'];
  const modelsToTry: string[] = [];
  for (const m of rawModels) {
    if (m && !modelsToTry.includes(m)) {
      modelsToTry.push(m);
    }
  }

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const startTime = Date.now();
      try {
        console.log(`[Gemini Call] model=${model}, attempt=${attempt}`);
        const response = await ai.models.generateContent({
          ...params,
          model,
        });
        const latencyMs = Date.now() - startTime;
        console.log(`[Gemini Success] Answered by ${model} in ${latencyMs}ms (attempt ${attempt})`);
        (response as any).modelUsed = model;
        (response as any).latencyMs = latencyMs;
        return response;
      } catch (err: any) {
        lastError = err;
        const latencyMs = Date.now() - startTime;
        const status = Number(err?.status || err?.statusCode || (err?.response && err?.response?.status) || 0);
        const msg = String(err?.message || err || '').toLowerCase();

        const isSkipError =
          status === 503 ||
          status === 429 ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('limit') ||
          msg.includes('rate') ||
          msg.includes('exhausted') ||
          msg.includes('unavailable') ||
          msg.includes('overloaded') ||
          msg.includes('high demand') ||
          msg.includes('resource_exhausted');

        if (isSkipError) {
          console.warn(`[Gemini Skip] Model ${model} quota/unavailable (${status || msg.slice(0, 50)}) in ${latencyMs}ms. Skipping to next model.`);
          if (status === 429 || msg.includes('quota') || msg.includes('exhausted') || msg.includes('resource_exhausted')) {
            geminiQuotaExhaustedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes circuit breaker
          }
          break; // break immediately and go to next model
        }

        const isFatalError =
          (status >= 400 && status < 500 && status !== 429) ||
          msg.includes('api_key') ||
          msg.includes('invalid key') ||
          msg.includes('unauthorized');

        if (isFatalError) {
          console.error(`[Gemini Fatal Error] Model ${model} returned fatal error ${status}: ${msg}`);
          throw err;
        }

        if (attempt < retries) {
          const waitMs = delay * Math.pow(2, attempt - 1);
          console.warn(`[Gemini Retry] Model ${model} attempt ${attempt} failed in ${latencyMs}ms (${msg.slice(0, 60)}). Retrying in ${waitMs}ms...`);
          await new Promise((r) => setTimeout(r, waitMs));
        } else {
          console.warn(`[Gemini Model Exhausted] Model ${model} all ${retries} attempts failed.`);
        }
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
}

/**
 * Helper to identify if an endpoint is targeting a local or private LAN address
 * (e.g. localhost, 127.0.0.1, 172.30.115.239, 192.168.x.x, 10.x.x.x).
 * Cloud Run containers have no network route to private WiFi/LAN subnets.
 */
function isLocalhostUrl(urlStr?: string): boolean {
  if (!urlStr) return false;
  return /localhost|127\.0\.0\.1|0\.0\.0\.0|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|10\./i.test(urlStr);
}

/**
 * Checks whether the server should attempt to contact a Local AI endpoint.
 * In a cloud environment (e.g. Cloud Run with K_SERVICE or production), local & LAN
 * targets the student's PC or host server, which is inaccessible from Cloud Run.
 */
function shouldAttemptLocalAiOnServer(config?: { enabled?: boolean; endpoint?: string }): boolean {
  if (!config || !config.enabled) return false;
  if (isLocalhostUrl(config.endpoint)) {
    if (process.env.K_SERVICE || process.env.NODE_ENV === 'production') {
      return false;
    }
  }
  return true;
}

/**
 * Local AI Helper: Calls OpenAI-compatible local LLM server
 * (Ollama, LM Studio, vLLM, llama.cpp, LocalAI)
 */
async function callLocalAi(
  config: { endpoint: string; model: string; apiKey?: string; temperature?: number },
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  responseFormatJson: boolean = true
): Promise<string> {
  const baseEndpoint = (config.endpoint || 'http://localhost:1234/v1').trim().replace(/\/+$/, '');
  
  if (isLocalhostUrl(baseEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    throw new Error('Local AI endpoint points to localhost, which is inaccessible from the cloud backend container.');
  }

  const chatUrl = baseEndpoint.endsWith('/chat/completions')
    ? baseEndpoint
    : `${baseEndpoint}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const payload: any = {
    model: config.model || 'google/gemma-4-e4b',
    messages,
    temperature: config.temperature ?? 0.1,
  };
  if (responseFormatJson) {
    payload.response_format = { type: 'json_object' };
  }

  // Strictly 2s timeout and no retry for local LLM text responses
  const response = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(2000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Local AI HTTP ${response.status}: ${errorBody}`);
  }

  const data: any = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * VIAA-GOT text cleaner: lowercase, strip punctuation, normalize spaces
 */
function clean(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * VIAA-GOT bag-of-words similarity (0-100)
 */
function getStringSimilarity(str1: string, str2: string): number {
  const s1 = clean(str1);
  const s2 = clean(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;
  const w1 = s1.split(' ').filter(Boolean);
  const w2 = s2.split(' ').filter(Boolean);
  if (w1.length === 0 || w2.length === 0) return 0;
  let matches = 0;
  for (const word of w1) {
    if (w2.includes(word)) matches++;
  }
  return Math.round((matches / Math.max(w1.length, w2.length)) * 100);
}

/**
 * Safe JSON parser with balanced braces and repair for model output
 */
function parseEvaluationJson(rawText: string): any {
  if (!rawText) return null;
  const cleanText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleanText);
  } catch {
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
    if (firstBrace !== -1) {
      let candidate = cleanText.substring(firstBrace);
      const quoteCount = (candidate.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) candidate += '"';
      const openBrackets = (candidate.match(/\[/g) || []).length - (candidate.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets; i++) candidate += ']';
      const openBraces = (candidate.match(/\{/g) || []).length - (candidate.match(/\}/g) || []).length;
      for (let i = 0; i < openBraces; i++) candidate += '}';
      try {
        return JSON.parse(candidate);
      } catch {}
    }
  }
  return null;
}

/**
 * Server-side scenario-step matching (VIAA-GOT checkAviationTemplateMatchEx):
 * - Extracts sentence triggers from expectedText (clean whole phrase + clauses >= 2 words).
 * - Checks trigger match and computes bag-of-words similarity.
 * - Match thresholds: hard > 90, normal >= 50, easy > 20.
 */
function checkAviationTemplateMatchEx(
  transcribedText: string,
  expectedPhrase: string,
  difficulty: string = 'normal'
): { matchedStep: boolean; similarity: number; triggerMatched: boolean } {
  if (!transcribedText || !expectedPhrase) {
    return { matchedStep: false, similarity: 0, triggerMatched: false };
  }

  const cleanExpected = clean(expectedPhrase);
  const sentenceParts = (expectedPhrase || '')
    .split(/[.!?]/)
    .map(clean)
    .filter((t) => t.split(' ').filter(Boolean).length >= 2);

  const triggers = Array.from(new Set([cleanExpected, ...sentenceParts])).filter(Boolean);
  const cleanTranscription = clean(transcribedText);

  let triggerMatched = false;
  if (cleanTranscription && triggers.length > 0) {
    for (const trig of triggers) {
      if (cleanTranscription.includes(trig) || trig.includes(cleanTranscription)) {
        triggerMatched = true;
        break;
      }
    }
  }

  const sim = getStringSimilarity(cleanTranscription, cleanExpected);
  const templateScore = triggerMatched ? 100 : sim;

  let matchedStep = false;
  if (difficulty === 'hard') {
    matchedStep = templateScore > 90;
  } else if (difficulty === 'easy') {
    matchedStep = templateScore > 20;
  } else {
    matchedStep = templateScore >= 50;
  }

  return { matchedStep, similarity: templateScore, triggerMatched };
}

/**
 * Endpoint: POST /api/test-local-ai
 * Pings the local LLM server to test connectivity, model availability, and measure roundtrip latency.
 */
app.post('/api/test-local-ai', async (req, res) => {
  const { endpoint = 'http://localhost:11434/v1', model = 'qwen2.5:3b', apiKey } = req.body;
  const startTime = Date.now();
  const baseEndpoint = (endpoint || 'http://localhost:11434/v1').trim().replace(/\/+$/, '');

  if (isLocalhostUrl(baseEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    return res.json({
      success: false,
      isCloudEnvironment: true,
      message: 'Ứng dụng đang chạy trên Cloud nên máy chủ không thể truy cập localhost của bạn. Trình duyệt trên máy tính sẽ kết nối trực tiếp với Local AI khi thực hành.',
    });
  }

  try {
    const modelsUrl = baseEndpoint.endsWith('/v1')
      ? `${baseEndpoint}/models`
      : `${baseEndpoint}/v1/models`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let models: string[] = [];
    try {
      const resp = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const data: any = await resp.json();
        if (Array.isArray(data.data)) {
          models = data.data.map((m: any) => m.id || m.name || String(m));
        } else if (Array.isArray(data.models)) {
          models = data.models.map((m: any) => m.name || m.id || String(m));
        }
      }
    } catch {
      // Models endpoint not responding, continue with chat ping
    }

    // Direct chat ping to test actual inference capability
    const chatUrl = baseEndpoint.endsWith('/chat/completions')
      ? baseEndpoint
      : baseEndpoint.endsWith('/v1')
      ? `${baseEndpoint}/chat/completions`
      : `${baseEndpoint}/v1/chat/completions`;

    const pingModel = model || (models.length > 0 ? models[0] : 'google/gemma-4-e4b');

    const chatResp = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: pingModel,
        messages: [{ role: 'user', content: 'Ping ICAO test' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!chatResp.ok) {
      const errText = await chatResp.text();
      return res.status(400).json({
        success: false,
        error: `Server Local phản hồi mã lỗi ${chatResp.status}: ${errText.slice(0, 200)}`,
        latencyMs: Date.now() - startTime,
      });
    }

    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      latencyMs,
      models: models.length > 0 ? models : [model],
      message: `Kết nối thành công tới ${baseEndpoint} (Độ trễ: ${latencyMs}ms)`,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      latencyMs,
      error: `Không thể kết nối tới ${baseEndpoint}: ${error?.message || error}. Vui lòng kiểm tra lại trạng thái server Local AI trên máy tính.`,
    });
  }
});

/**
 * Endpoint: POST /api/test-docker-whisper
 * Tests connection to Faster-Whisper container (:8000)
 */
app.post('/api/test-docker-whisper', async (req, res) => {
  const { endpoint = 'http://localhost:8000/v1' } = req.body;
  const startTime = Date.now();
  const cleanEndpoint = (endpoint || 'http://localhost:8000/v1').trim().replace(/\/+$/, '');

  if (isLocalhostUrl(cleanEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    return res.json({
      success: false,
      isCloudEnvironment: true,
      message: 'Ứng dụng đang chạy trên Cloud nên máy chủ không thể kết nối tới localhost của bạn. Trình duyệt trên máy tính sẽ kết nối trực tiếp với Faster-Whisper (:8000).',
    });
  }

  const url = cleanEndpoint.endsWith('/v1') ? `${cleanEndpoint}/models` : `${cleanEndpoint}/v1/models`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - startTime;
    if (resp.ok || resp.status === 404 || resp.status === 405) {
      return res.json({ success: true, latencyMs, message: `Faster-Whisper (:8000) đang hoạt động tốt (${latencyMs}ms)` });
    }
    return res.status(resp.status).json({ success: false, error: `Faster-Whisper phản hồi mã HTTP ${resp.status}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Không thể kết nối tới Faster-Whisper (:8000)' });
  }
});

/**
 * Endpoint: POST /api/test-docker-localai
 * Tests connection to LocalAI container (:8081)
 */
app.post('/api/test-docker-localai', async (req, res) => {
  const { endpoint = 'http://localhost:8081/v1' } = req.body;
  const startTime = Date.now();
  const cleanEndpoint = (endpoint || 'http://localhost:8081/v1').trim().replace(/\/+$/, '');

  if (isLocalhostUrl(cleanEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    return res.json({
      success: false,
      isCloudEnvironment: true,
      message: 'Ứng dụng đang chạy trên Cloud nên máy chủ không thể kết nối tới localhost của bạn. Trình duyệt trên máy tính sẽ kết nối trực tiếp với LocalAI (:8081).',
    });
  }

  const url = cleanEndpoint.endsWith('/v1') ? `${cleanEndpoint}/models` : `${cleanEndpoint}/v1/models`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const latencyMs = Date.now() - startTime;
    if (resp.ok) {
      const data: any = await resp.json();
      const models = Array.isArray(data.data) ? data.data.map((m: any) => m.id || m.name || String(m)) : [];
      return res.json({
        success: true,
        latencyMs,
        models,
        message: `LocalAI (:8081) đang hoạt động tốt (${latencyMs}ms, ${models.length} models)`,
      });
    }
    return res.status(resp.status).json({ success: false, error: `LocalAI phản hồi mã HTTP ${resp.status}` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || 'Không thể kết nối tới LocalAI (:8081)' });
  }
});

/**
 * Endpoint: POST /api/docker-whisper-transcribe
 * Backend proxy to transcribe audio via Faster-Whisper container (:8000)
 */
app.post('/api/docker-whisper-transcribe', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', endpoint = 'http://localhost:8000/v1', model = 'Systran/faster-whisper-small' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'Thiếu audioBase64' });
  }

  const cleanEndpoint = endpoint.trim().replace(/\/+$/, '');

  if (isLocalhostUrl(cleanEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    return res.status(400).json({
      error: 'Máy chủ Cloud không thể truy cập localhost của máy tính bạn. Trình duyệt sẽ gửi trực tiếp tới Faster-Whisper (:8000).',
    });
  }

  const targetUrl = cleanEndpoint.endsWith('/audio/transcriptions')
    ? cleanEndpoint
    : cleanEndpoint.endsWith('/v1')
    ? `${cleanEndpoint}/audio/transcriptions`
    : `${cleanEndpoint}/v1/audio/transcriptions`;

  try {
    const rawBuffer = Buffer.from(audioBase64, 'base64');
    const boundary = '----AeroCommsWhisperBoundary' + Date.now();
    const filename = mimeType.includes('mp4') ? 'audio.mp4' : 'audio.webm';

    // Build multipart/form-data payload
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${model}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nen\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
      rawBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const fullBody = Buffer.concat(parts);

    const whisperResp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(fullBody.length),
      },
      body: fullBody,
      signal: AbortSignal.timeout(8000),
    });

    if (!whisperResp.ok) {
      const errText = await whisperResp.text();
      return res.status(whisperResp.status).json({ error: `Faster-Whisper error: ${errText.slice(0, 200)}` });
    }

    const data: any = await whisperResp.json();
    return res.json({ text: (data.text || '').trim() });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Lỗi kết nối Faster-Whisper proxy' });
  }
});

/**
 * Endpoint: POST /api/docker-localai-tts
 * Backend proxy for LocalAI TTS (:8081)
 */
app.post('/api/docker-localai-tts', async (req, res) => {
  const { text, speaker = 'Cockpit', endpoint = 'http://localhost:8081/v1', voice } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Thiếu text' });
  }

  const cleanEndpoint = (endpoint || 'http://localhost:8081/v1').trim().replace(/\/+$/, '');

  if (isLocalhostUrl(cleanEndpoint) && (process.env.K_SERVICE || process.env.NODE_ENV === 'production')) {
    return res.status(400).json({
      error: 'Máy chủ Cloud không thể truy cập localhost của máy tính bạn. Trình duyệt sẽ gọi trực tiếp tới LocalAI TTS (:8081).',
    });
  }

  const ttsUrl = cleanEndpoint.endsWith('/audio/speech')
    ? cleanEndpoint
    : cleanEndpoint.endsWith('/v1')
    ? `${cleanEndpoint}/audio/speech`
    : `${cleanEndpoint}/v1/audio/speech`;

  const selectedVoice = voice || (speaker === 'Ground' ? 'en-us-male' : 'en-us-female');

  try {
    const ttsResp = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: selectedVoice,
        response_format: 'wav',
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (ttsResp.ok) {
      const arrayBuffer = await ttsResp.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return res.json({ audioBase64: base64 });
    }
    return res.status(ttsResp.status).json({ error: `LocalAI TTS error ${ttsResp.status}` });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Lỗi kết nối LocalAI TTS' });
  }
});

/**
 * Endpoint: POST /api/evaluate-speech
 * VIAA-GOT Speech-to-Text & Aviation Evaluation Pipeline:
 * 1. Multimodal Gemini Flash audio evaluation (or local LLM for text-only fallback).
 * 2. Step 1 transcription first (verbatim standard English spelling), Step 2 evaluation.
 * 3. Safe balanced JSON parsing.
 * 4. Server-side scenario-step template matching (trigger matching + bag-of-words similarity).
 * 5. Inline TTS generation via gemini-3.8-flash-lite-tts to avoid separate client roundtrip.
 */
app.post('/api/evaluate-speech', async (req, res) => {
  try {
    const {
      audio,
      audioBase64,
      mimeType = 'audio/webm',
      typedText,
      transcript,
      history = [],
      expectedText = '',
      expectedPhrase = '',
      aiReplyText = '',
      aiSpeaker = 'Cockpit',
      difficulty = 'normal',
      practiceMode = 'scenario',
      scenarioTitle = '',
      userRole = 'Ground',
      role = 'Ground',
      voiceEnabled = true,
      maxOutputTokens = 650,
      currentPairIndex,
      studentLevel = 'intermediate',
      localAiConfig,
    } = req.body;

    const targetPhrase = (expectedText || expectedPhrase || '').trim();
    const effectiveRole = userRole || role || 'Ground';
    const effectiveAiSpeaker = aiSpeaker || (effectiveRole === 'Ground' ? 'Cockpit' : 'Ground');

    // Difficulty normalization: 'easy' | 'normal' | 'hard'
    let normalizedDifficulty = 'normal';
    if (difficulty === 'easy' || difficulty === 'normal' || difficulty === 'hard') {
      normalizedDifficulty = difficulty;
    } else if (studentLevel === 'beginner') {
      normalizedDifficulty = 'easy';
    } else if (studentLevel === 'advanced') {
      normalizedDifficulty = 'hard';
    }

    const passingThreshold = normalizedDifficulty === 'easy' ? 30 : normalizedDifficulty === 'hard' ? 70 : 50;
    const levelName = normalizedDifficulty === 'easy'
      ? 'Mức 1: Cơ bản (> 30% là đạt)'
      : normalizedDifficulty === 'hard'
      ? 'Mức 3: Đạt chuẩn đầu ra (> 70% là đạt)'
      : 'Mức 2: Tiêu chuẩn huấn luyện (> 50% là đạt)';

    const rawAudio = (audio || audioBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
    const cleanTyped = (typedText || transcript || '').trim();

    // 1. If audio exists, NEVER send to local LLM (local models cannot hear audio)
    // Only if audio is NOT present, local AI is enabled, and server can reach it:
    if (!rawAudio && shouldAttemptLocalAiOnServer(localAiConfig) && cleanTyped) {
      try {
        console.log(`[Local AI] Evaluating text with local model '${localAiConfig.model}'`);
        const localPrompt = `You are an expert ICAO Aviation Radio Telephony Examiner at Victoria Aviation Academy (VIAA).
Target Standard ICAO Phrase: "${targetPhrase}"
Student Typed: "${cleanTyped}"
Student Level: ${normalizedDifficulty} (Passing threshold: > ${passingThreshold}%)

STEP 1: TRANSCRIPTION
Verbatim transcript: "${cleanTyped}"

STEP 2: EVALUATION
Compare with the target ICAO phrase and score pronunciation and phraseology.
Output valid JSON only with this schema:
{
  "transcribedText": "${cleanTyped}",
  "understoodAs": "${targetPhrase || cleanTyped}",
  "overallScore": number (0-100),
  "pronunciationScore": number (0-100),
  "phraseologyScore": number (0-100),
  "mispronouncedWords": [{"word": string, "tip": string, "correctIcao": string}],
  "feedbackSummary": string (Vietnamese, max 2 sentences),
  "assistantReply": string
}`;
        const localResponseText = await callLocalAi(
          localAiConfig,
          [
            { role: 'system', content: 'You are an ICAO Aviation Radio Examiner. Output valid JSON only.' },
            { role: 'user', content: localPrompt },
          ],
          true
        );

        const parsed = parseEvaluationJson(localResponseText) || {};
        const rawTranscribed = (parsed.transcribedText || cleanTyped).trim();

        const matchResult = checkAviationTemplateMatchEx(rawTranscribed, targetPhrase, normalizedDifficulty);
        const templateScore = matchResult.similarity;
        const matchedStep = matchResult.matchedStep;
        const triggerMatched = matchResult.triggerMatched;

        const displayedTranscribedText = (matchedStep && triggerMatched && targetPhrase)
          ? targetPhrase
          : rawTranscribed;

        const modelPhraseology = Math.max(0, Math.min(100, Math.round(Number(parsed.phraseologyScore) || 75)));
        const phraseologyScore = templateScore >= 50 ? Math.max(modelPhraseology, templateScore) : modelPhraseology;
        const pronunciationScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pronunciationScore) || phraseologyScore)));
        const overallScore = Math.max(0, Math.min(100, Math.round(pronunciationScore * 0.45 + phraseologyScore * 0.55)));
        const isPassed = matchedStep && overallScore >= passingThreshold;
        const requiresRetry = !isPassed;

        const grade: EvaluationGrade = overallScore >= (passingThreshold + 25) ? 'good' : isPassed ? 'passed' : 'not_passed';
        const rubricLevel = overallScore >= (passingThreshold + 25)
          ? `Mức Tốt (>${passingThreshold + 25}%)`
          : isPassed
          ? `Mức Đạt (>${passingThreshold}%)`
          : `Chưa Đạt (≤${passingThreshold}%)`;

        let assistantReply = '';
        if (!isPassed && practiceMode !== 'free') {
          const repeatPhrases = ['Please repeat.', 'Repeat again.', 'Cockpit to Ground.'];
          const repIdx = (typeof currentPairIndex === 'number' ? currentPairIndex : 0) % repeatPhrases.length;
          assistantReply = repeatPhrases[repIdx];
        } else if (practiceMode === 'free') {
          assistantReply = parsed.assistantReply || 'Roger. Message understood.';
        } else {
          assistantReply = aiReplyText || parsed.assistantReply || 'Roger.';
        }

        return res.json({
          overallScore,
          pronunciationScore,
          phraseologyScore,
          grammarScore: phraseologyScore,
          vocabularyScore: phraseologyScore,
          templateScore,
          grade,
          isPassed,
          requiresRetry,
          transcribedText: displayedTranscribedText,
          rawTranscription: rawTranscribed,
          understoodAs: (parsed.understoodAs || targetPhrase || rawTranscribed).trim(),
          phoneticToleranceApplied: '',
          mispronouncedWords: Array.isArray(parsed.mispronouncedWords)
            ? parsed.mispronouncedWords.slice(0, 3).map((m: any) => ({
                word: String(m.word || ''),
                tip: String(m.tip || ''),
                correctIcao: m.correctIcao ? String(m.correctIcao) : undefined,
              }))
            : [],
          strengths: isPassed ? ['Khẩu lệnh đạt chuẩn quy định'] : ['Đã tiếp nhận khẩu lệnh'],
          improvements: !isPassed ? [`Điểm dưới ${passingThreshold}%: Vui lòng phát âm lại`] : [],
          rubricLevel,
          feedbackSummary: (parsed.feedbackSummary || (isPassed ? 'Khẩu lệnh đạt chuẩn.' : 'Chưa đạt chuẩn, vui lòng nói lại.')).trim(),
          matchedStep,
          similarity: templateScore,
          currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
          modelUsed: localAiConfig.model || 'local-ai',
          assistantReply,
          replyAudioBase64: null,
          difficulty: normalizedDifficulty,
        });
      } catch {
        console.warn('[Local AI Notice] Local model evaluation offline or unreachable, smoothly continuing with Gemini.');
      }
    }

    // If neither audio nor text was provided, return immediate friendly retry response
    if (!rawAudio && !cleanTyped) {
      return res.json({
        overallScore: 0,
        pronunciationScore: 0,
        phraseologyScore: 0,
        grammarScore: 0,
        vocabularyScore: 0,
        templateScore: 0,
        grade: 'not_passed' as EvaluationGrade,
        isPassed: false,
        requiresRetry: true,
        transcribedText: '(Không nghe rõ – vui lòng nói lại)',
        rawTranscription: '',
        understoodAs: '',
        phoneticToleranceApplied: '',
        mispronouncedWords: [],
        strengths: [],
        improvements: ['Hệ thống không nhận được tín hiệu âm thanh, vui lòng nói lại'],
        rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
        feedbackSummary: 'Hệ thống không nhận được âm thanh. Vui lòng kiểm tra microphone và phát âm lại.',
        matchedStep: false,
        similarity: 0,
        currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
        modelUsed: 'none',
        assistantReply: 'Please repeat.',
        replyAudioBase64: null,
        difficulty: normalizedDifficulty,
      });
    }

    // 2. Multimodal Gemini Flash audio evaluation (VIAA-GOT pipeline)
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    let targetMime = 'audio/webm';
    if (cleanMime === 'audio/mp4' || cleanMime === 'audio/m4a') targetMime = 'audio/mp4';
    else if (cleanMime === 'audio/wav' || cleanMime === 'audio/x-wav') targetMime = 'audio/wav';
    else if (cleanMime === 'audio/ogg') targetMime = 'audio/ogg';
    else if (cleanMime === 'audio/mp3' || cleanMime === 'audio/mpeg') targetMime = 'audio/mp3';
    else if (cleanMime === 'audio/aac') targetMime = 'audio/aac';

    // VIAA-GOT prompt order: STEP 1 transcription first verbatim, STEP 2 evaluation.
    // No preliminary hint, no misspelled examples, standard English spelling verbatim.
    const promptText = `You are an expert ICAO Aviation Radio Telephony Examiner at Victoria Aviation Academy (VIAA).
You are evaluating radio telephony communication between Ground Headset Operator and Cockpit Flight Crew.
Role of speaker: ${effectiveRole}
Scenario: ${scenarioTitle || 'Aviation Ground Operations'}
Difficulty level: ${normalizedDifficulty} (${levelName})

Follow these two steps strictly:

STEP 1: TRANSCRIPTION
Transcribe EXACTLY what the student said, verbatim, in standard English spelling.
Do NOT correct it to the target phrase, do NOT add missing words.
If silent or unintelligible return an empty string.

STEP 2: EVALUATION
Compare with standard ICAO aviation phraseology:
- Evaluate pronunciation clarity and standard phraseology adherence (0-100).
- Identify up to 3 mispronounced words with actionable tips.
- Provide a concise feedbackSummary in Vietnamese (maximum 2 sentences).
`;

    // Map conversation history with alternating roles
    const geminiContents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        const hRole = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
        const hText = (h.text || '').trim();
        if (!hText) continue;
        if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === hRole) {
          geminiContents[geminiContents.length - 1].parts[0].text += `\n${hText}`;
        } else {
          geminiContents.push({ role: hRole, parts: [{ text: hText }] });
        }
      }
    }
    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === 'user') {
      geminiContents.push({ role: 'model', parts: [{ text: 'Standing by.' }] });
    }

    const userParts: any[] = [];
    if (rawAudio) {
      userParts.push({
        inlineData: {
          data: rawAudio,
          mimeType: targetMime,
        },
      });
      userParts.push({ text: promptText });
    } else {
      userParts.push({ text: `Student input: "${cleanTyped}"\n\n${promptText}` });
    }

    geminiContents.push({
      role: 'user',
      parts: userParts,
    });

    const evaluationSchema = {
      type: Type.OBJECT,
      properties: {
        transcribedText: {
          type: Type.STRING,
          description: 'Verbatim transcription in standard English spelling. Empty string if silent or unintelligible.',
        },
        understoodAs: {
          type: Type.STRING,
          description: 'The standard ICAO phrase understood or closest matching phrase.',
        },
        overallScore: {
          type: Type.INTEGER,
          description: 'Overall aviation communication score 0-100.',
        },
        pronunciationScore: {
          type: Type.INTEGER,
          description: 'Pronunciation accuracy score 0-100.',
        },
        phraseologyScore: {
          type: Type.INTEGER,
          description: 'Standard phraseology score 0-100.',
        },
        grammarScore: {
          type: Type.INTEGER,
          description: 'Grammar adherence score 0-100.',
        },
        vocabularyScore: {
          type: Type.INTEGER,
          description: 'Aviation vocabulary accuracy score 0-100.',
        },
        mispronouncedWords: {
          type: Type.ARRAY,
          description: 'Up to 3 words needing improvement.',
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              tip: { type: Type.STRING },
              correctIcao: { type: Type.STRING },
            },
            required: ['word', 'tip'],
          },
        },
        feedbackSummary: {
          type: Type.STRING,
          description: 'Concise feedback in Vietnamese, maximum 2 sentences.',
        },
        assistantReply: {
          type: Type.STRING,
          description: 'Appropriate English operational reply from the other party.',
        },
      },
      required: [
        'transcribedText',
        'understoodAs',
        'overallScore',
        'pronunciationScore',
        'phraseologyScore',
        'mispronouncedWords',
        'feedbackSummary',
      ],
      propertyOrdering: [
        'transcribedText',
        'understoodAs',
        'overallScore',
        'pronunciationScore',
        'phraseologyScore',
        'mispronouncedWords',
        'feedbackSummary',
      ],
    };

    let parsed: any = null;
    let modelUsed = 'gemini-3.1-flash-lite';

    try {
      if (ai) {
        const response = await generateContentWithRetry({
          models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'],
          contents: geminiContents,
          config: {
            temperature: 0,
            maxOutputTokens: Math.min(maxOutputTokens || 650, 800),
            responseMimeType: 'application/json',
            responseSchema: evaluationSchema,
          },
        });
        modelUsed = (response as any).modelUsed || 'gemini-3.1-flash-lite';
        parsed = parseEvaluationJson(response.text || '{}') || {};
      } else {
        throw new Error('No AI client');
      }
    } catch (apiErr: any) {
      console.log('[Aviation Heuristic Evaluation Active]: Using offline ICAO evaluation rules.');
      modelUsed = 'offline-aviation-fallback';
      
      const fallbackText = cleanTyped || (targetPhrase ? targetPhrase : 'roger');
      const matchRes = checkAviationTemplateMatchEx(fallbackText, targetPhrase || fallbackText, normalizedDifficulty);
      const fallbackScore = matchRes.similarity > 0 ? matchRes.similarity : 85;

      parsed = {
        transcribedText: fallbackText,
        understoodAs: targetPhrase || fallbackText,
        overallScore: fallbackScore,
        pronunciationScore: fallbackScore,
        phraseologyScore: Math.min(100, fallbackScore + 5),
        grammarScore: fallbackScore,
        vocabularyScore: fallbackScore,
        mispronouncedWords: [],
        feedbackSummary: `Hệ thống đánh giá dự phòng (quota API đạt giới hạn). Khẩu lệnh khớp ${fallbackScore}%.`,
        assistantReply: aiReplyText || 'Roger. Continue procedure.',
      };
    }

    const rawTranscribed = (parsed?.transcribedText || (rawAudio ? '' : cleanTyped)).trim();

    // 3. If transcribedText is empty, never substitute expectedText — return "(Không nghe rõ – vui lòng nói lại)" with isPassed=false
    if (!rawTranscribed) {
      return res.json({
        overallScore: 0,
        pronunciationScore: 0,
        phraseologyScore: 0,
        grammarScore: 0,
        vocabularyScore: 0,
        templateScore: 0,
        grade: 'not_passed' as EvaluationGrade,
        isPassed: false,
        requiresRetry: true,
        transcribedText: '(Không nghe rõ – vui lòng nói lại)',
        rawTranscription: '',
        understoodAs: '',
        phoneticToleranceApplied: '',
        mispronouncedWords: [],
        strengths: [],
        improvements: ['Không thu được âm thanh rõ ràng hoặc học viên chưa nói, vui lòng phát âm lại'],
        rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
        feedbackSummary: 'Hệ thống không nghe rõ âm thanh hoặc tín hiệu quá nhỏ. Vui lòng nói lại rõ ràng vào microphone.',
        matchedStep: false,
        similarity: 0,
        currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
        modelUsed,
        assistantReply: 'Please repeat.',
        replyAudioBase64: null,
        difficulty: normalizedDifficulty,
      });
    }

    // 4. Server-side scenario-step template matching (VIAA-GOT PART 5)
    const matchResult = checkAviationTemplateMatchEx(rawTranscribed, targetPhrase, normalizedDifficulty);
    const templateScore = matchResult.similarity;
    const matchedStep = matchResult.matchedStep;
    const triggerMatched = matchResult.triggerMatched;

    // If matched: displayedText = triggerMatched ? expectedText : transcription
    // If NOT matched: displayedText = transcription
    const displayedTranscribedText = (matchedStep && triggerMatched && targetPhrase)
      ? targetPhrase
      : rawTranscribed;

    const modelPhraseology = Math.max(0, Math.min(100, Math.round(Number(parsed.phraseologyScore) || 0)));
    const phraseologyScore = templateScore >= 50 ? Math.max(modelPhraseology, templateScore) : modelPhraseology;
    const pronunciationScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pronunciationScore) || phraseologyScore)));
    const grammarScore = Math.max(0, Math.min(100, Math.round(Number(parsed.grammarScore) || phraseologyScore)));
    const vocabularyScore = Math.max(0, Math.min(100, Math.round(Number(parsed.vocabularyScore) || phraseologyScore)));

    const overallScore = Math.max(0, Math.min(100, Math.round(pronunciationScore * 0.45 + phraseologyScore * 0.55)));
    const isPassed = matchedStep && overallScore >= passingThreshold;
    const requiresRetry = !isPassed;

    const grade: EvaluationGrade = overallScore >= (passingThreshold + 25) ? 'good' : isPassed ? 'passed' : 'not_passed';
    const rubricLevel = overallScore >= (passingThreshold + 25)
      ? `Mức Tốt (>${passingThreshold + 25}%)`
      : isPassed
      ? `Mức Đạt (>${passingThreshold}%)`
      : `Chưa Đạt (≤${passingThreshold}%)`;

    const strengths: string[] = [];
    if (isPassed) {
      strengths.push('Truyền đạt đúng khẩu lệnh ICAO quy định');
      if (pronunciationScore >= 70) strengths.push('Phát âm rõ ràng trên tần số vô tuyến');
    } else {
      strengths.push('Đã ghi nhận khẩu lệnh');
    }

    const improvements: string[] = [];
    if (!isPassed) {
      improvements.push(`Điểm chưa đạt chuẩn ${levelName} (cần > ${passingThreshold}%). Vui lòng phát âm lại.`);
    }

    const mispronouncedWords: MispronouncedWord[] = Array.isArray(parsed.mispronouncedWords)
      ? parsed.mispronouncedWords.slice(0, 3).map((item: any) => ({
          word: String(item.word || ''),
          tip: String(item.tip || ''),
          correctIcao: item.correctIcao ? String(item.correctIcao) : undefined,
        }))
      : [];

    const feedbackSummary = (parsed.feedbackSummary || (isPassed ? 'Khẩu lệnh đạt chuẩn yêu cầu huấn luyện.' : 'Chưa đạt chuẩn yêu cầu, vui lòng luyện tập phát âm lại.')).trim();

    // Determine Assistant Reply
    let assistantReply = '';
    if (!isPassed && practiceMode !== 'free') {
      const repeatPhrases = ['Please repeat.', 'Repeat again.', 'Cockpit to Ground.'];
      const repIdx = (typeof currentPairIndex === 'number' ? currentPairIndex : 0) % repeatPhrases.length;
      assistantReply = repeatPhrases[repIdx];
    } else if (practiceMode === 'free') {
      assistantReply = parsed.assistantReply || 'Roger. Message understood.';
    } else {
      assistantReply = aiReplyText || parsed.assistantReply || 'Roger.';
    }

    // 5. Inline TTS generation via gemini-3.8-flash-lite-tts (VIAA-GOT PART 6)
    let replyAudioBase64: string | null = null;
    if (voiceEnabled && assistantReply && Date.now() >= ttsQuotaExhaustedUntil && ai) {
      try {
        const voiceName = effectiveAiSpeaker === 'Cockpit' ? 'Zephyr' : 'Kore';
        const ttsResponse = await generateContentWithRetry({
          models: ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
          contents: [
            {
              role: 'user',
              parts: [{ text: assistantReply }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });
        replyAudioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (ttsErr: any) {
        const errMsg = String(ttsErr?.message || ttsErr || '');
        if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota')) {
          ttsQuotaExhaustedUntil = Date.now() + 5 * 60 * 1000; // 5-minute cooldown
          console.log('[TTS] Inline synthesis quota exceeded, setting 5-minute cooldown.');
        } else {
          console.log('[TTS] Inline synthesis notice:', errMsg);
        }
      }
    }

    return res.json({
      overallScore,
      pronunciationScore,
      phraseologyScore,
      grammarScore,
      vocabularyScore,
      templateScore,
      grade,
      isPassed,
      requiresRetry,
      transcribedText: displayedTranscribedText,
      rawTranscription: rawTranscribed,
      understoodAs: (parsed.understoodAs || targetPhrase || '').trim(),
      phoneticToleranceApplied: '',
      mispronouncedWords,
      strengths,
      improvements,
      rubricLevel,
      feedbackSummary,
      matchedStep,
      similarity: templateScore,
      currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
      modelUsed,
      assistantReply,
      replyAudioBase64,
      difficulty: normalizedDifficulty,
    });
  } catch (error: any) {
    console.error('Error in /api/evaluate-speech:', error);
    const passingThreshold = req.body?.studentLevel === 'beginner' ? 30 : req.body?.studentLevel === 'advanced' ? 70 : 50;
    return res.json({
      overallScore: 0,
      pronunciationScore: 0,
      phraseologyScore: 0,
      grammarScore: 0,
      vocabularyScore: 0,
      templateScore: 0,
      grade: 'not_passed' as EvaluationGrade,
      isPassed: false,
      requiresRetry: true,
      transcribedText: '(Không nghe rõ – vui lòng nói lại)',
      rawTranscription: '',
      understoodAs: '',
      phoneticToleranceApplied: '',
      mispronouncedWords: [],
      strengths: [],
      improvements: ['Vui lòng thử phát âm lại khẩu lệnh'],
      rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
      feedbackSummary: 'Hệ thống chưa xử lý được âm thanh. Vui lòng thử lại.',
      matchedStep: false,
      similarity: 0,
      modelUsed: 'error',
      assistantReply: 'Please repeat.',
      replyAudioBase64: null,
      difficulty: req.body?.difficulty || 'normal',
    });
  }
});

/**
 * Endpoint: POST /api/transcribe-audio
 * Ultra-fast Speech-To-Text processing using the fastest Gemini multimodal LLM (gemini-3.1-flash-lite).
 * Returns raw verbatim transcription with minimal latency.
 */
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio payload is required' });
    }

    const startTime = Date.now();
    const cleanData = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();

    const response = await generateContentWithRetry({
      models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'],
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: cleanData, mimeType: cleanMime } },
            {
              text: 'Transcribe the spoken audio EXACTLY verbatim in standard English spelling. Output only the transcribed text, nothing else. If silent or unintelligible, output nothing.',
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        maxOutputTokens: 200,
      },
    });

    const text = (response.text || '').trim();
    const latencyMs = Date.now() - startTime;
    return res.json({
      success: true,
      text,
      latencyMs,
      modelUsed: (response as any).modelUsed || 'gemini-3.1-flash-lite',
    });
  } catch (error: any) {
    console.error('Error in /api/transcribe-audio:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to transcribe audio',
      details: error?.message || String(error),
    });
  }
});

/**
 * Endpoint: POST /api/chat-turn
 * Generates in-character roleplay response for Free Practice or Process Exam.
 * High-speed text processing with gemini-3.1-flash-lite.
 */
app.post('/api/chat-turn', async (req, res) => {
  try {
    const {
      history = [],
      studentMessage = '',
      aiRole = 'Cockpit',
      scenarioTopic = 'Pushback and Ramp Operations',
      aircraft = 'A320neo',
      flightNumber = 'VJ100',
      practiceMode = 'free', // 'free' or 'exam'
      localAiConfig,
    } = req.body;

    const systemInstruction = `
You are an aviation professional at Victoria Aviation Academy (VIAA).
Role: ${aiRole === 'Cockpit' ? 'Captain / Pilot in Command (Cockpit)' : 'Headset Operator / Ground Marshaller (Ground)'}.
Aircraft: ${aircraft}, Flight: ${flightNumber}.
Scenario Context: ${scenarioTopic}.
Current Mode: ${practiceMode === 'exam' ? 'PROCESS EXAM (Kiểm tra quá trình - Thang điểm 100)' : 'FREE REFLEX DIALOGUE'}.

CRITICAL RULES:
1. ONLY respond to aviation headset communication / ramp operations (ICAO Annex 2/10 and VIAA manuals).
2. If student speaks out of domain, reject firmly: "Negative, maintain radio discipline on operational frequency."
3. In EXAM MODE: Challenge the student's operational reflexes with authentic aircraft/ground clearances, but strictly keep dialogue close to standard procedures so they don't veer off syllabus goals.
4. Keep transmission concise, crisp, authentic (1-2 radio sentences).
5. Output English transmission + Vietnamese translation + prowords used.
Format output as JSON: {"reply": string, "vietnameseTranslation": string, "prowordsUsed": string[], "safetyTip": string}
`;

    // Try Local AI first if configured and reachable
    if (shouldAttemptLocalAiOnServer(localAiConfig)) {
      try {
        console.log(`[Local AI] Generating chat turn with local model '${localAiConfig.model}'`);
        const localMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemInstruction },
        ];
        for (const item of history) {
          localMessages.push({
            role: item.isAi ? 'assistant' : 'user',
            content: `${item.speaker}: ${item.text}`,
          });
        }
        localMessages.push({
          role: 'user',
          content: `Student (${aiRole === 'Cockpit' ? 'Ground' : 'Cockpit'}): ${studentMessage}`,
        });

        const localReply = await callLocalAi(localAiConfig, localMessages, true);
        const cleaned = localReply.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.reply) {
          return res.json(parsed);
        }
      } catch {
        console.warn('[Local AI Notice] Local model unreachable, smoothly continuing with Gemini dialogue.');
      }
    }

    if (!ai) {
      const fallbackReply = aiRole === 'Cockpit'
        ? `Cockpit to Ground: Roger, parking brakes released. Clear to pushback facing North.`
        : `Ground to Cockpit: Roger Captain, ground check completed. Standing by for start clearance.`;
      return res.json({
        reply: fallbackReply,
        vietnameseTranslation: 'Buồng lái/Mặt đất xác nhận thông tin. Sẵn sàng theo quy trình.',
        prowordsUsed: ['ROGER', 'CLEAR'],
        safetyTip: 'Luôn giữ quy tắc đọc lại (Readback) đầy đủ mọi thông số an toàn.'
      });
    }

    const formattedMessages = history.map((item: any) => ({
      role: item.isAi ? 'model' : 'user',
      parts: [{ text: `${item.speaker}: ${item.text}` }]
    }));

    formattedMessages.push({
      role: 'user',
      parts: [{ text: `Student (${aiRole === 'Cockpit' ? 'Ground' : 'Cockpit'}): ${studentMessage}` }]
    });

    const response = await generateContentWithRetry({
      models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'],
      contents: formattedMessages,
      config: {
        systemInstruction,
        temperature: 0.25,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            vietnameseTranslation: { type: Type.STRING },
            prowordsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            safetyTip: { type: Type.STRING }
          },
          required: ['reply', 'vietnameseTranslation', 'prowordsUsed', 'safetyTip']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat-turn:', error);
    return res.status(500).json({
      error: 'Dialogue generation failed',
      details: error?.message || String(error)
    });
  }
});

/**
 * Endpoint: POST /api/tts
 * Fast speech generation with gemini-3.8-flash-lite-tts (or browser fallback)
 * Free-tier gemini-3.8-flash-lite-tts has a strict limit of 10 requests per day.
 * When exhausted, the server instantly serves browser Web Speech API (zero latency, zero 429 quota errors).
 */
let ttsQuotaExhaustedUntil = 0;

app.post('/api/tts', async (req, res) => {
  try {
    const { text, speaker = 'Cockpit' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Instant browser fallback when quota is exhausted or AI is not initialized (< 1ms latency)
    if (!ai || Date.now() < ttsQuotaExhaustedUntil) {
      return res.json({ audioBase64: null, useBrowserFallback: true, source: 'browser_tts' });
    }

    const voiceName = speaker === 'Cockpit' ? 'Zephyr' : 'Kore';

    const response = await generateContentWithRetry({
      models: ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
      contents: [
        {
          role: 'user',
          parts: [{ text: text }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    return res.json({
      audioBase64,
      mimeType: 'audio/wav',
      useBrowserFallback: !audioBase64
    });
  } catch (error: any) {
    const errMsg = String(error?.message || error || '');
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('Quota')) {
      ttsQuotaExhaustedUntil = Date.now() + 24 * 3600 * 1000;
      console.log('[TTS] Gemini TTS quota limit reached; instantly using browser Web Speech Synthesis.');
    } else {
      console.log('[TTS] Audio synthesis fallback to browser Web Speech Synthesis.');
    }
    return res.json({
      audioBase64: null,
      useBrowserFallback: true
    });
  }
});

// High-speed text similarity helper using checkAviationTemplateMatchEx
function calculateFastSimilarity(
  spoken: string,
  expected: string,
  level: string = 'intermediate'
): {
  similarity: number;
  understoodAs: string;
  phoneticToleranceApplied: string;
  matchedStep: boolean;
} {
  if (!spoken) {
    return {
      similarity: 0,
      understoodAs: expected || '',
      phoneticToleranceApplied: '',
      matchedStep: false,
    };
  }
  const matchResult = checkAviationTemplateMatchEx(spoken, expected);
  return {
    similarity: matchResult.similarity,
    understoodAs: expected || spoken,
    phoneticToleranceApplied: '',
    matchedStep: matchResult.matchedStep,
  };
}

// Full-stack Vite server setup
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✈️ AeroComms VIAA Server running on http://localhost:${PORT}`);
  });
}

startServer();
