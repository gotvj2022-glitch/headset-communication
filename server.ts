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

/**
 * Fast Text Evaluation Model: gemini-3.1-flash-lite
 * Optimized for low latency, bilingual (English & Vietnamese), and high throughput.
 */
const FAST_TEXT_MODEL = 'gemini-3.1-flash-lite';

/**
 * VIAA-GOT Resilient Generation Helper:
 * - Tries models in order: gemini-3.1-flash-lite, gemini-flash-latest, gemini-3.5-flash.
 * - Up to 2 attempts per model with 400 ms backoff.
 * - On HTTP 429, 503 or 404 skips immediately to the next model.
 * - Logs which model answered and the latency in ms.
 */
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<any> {
  if (!ai) {
    throw new Error('Gemini API client is not initialized.');
  }

  const candidateModels = params.models && params.models.length > 0
    ? params.models
    : ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'];

  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const startTime = Date.now();
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        const latencyMs = Date.now() - startTime;
        console.log(`[Gemini] Answered by ${model} in ${latencyMs}ms`);
        (response as any).modelUsed = model;
        (response as any).latencyMs = latencyMs;
        return response;
      } catch (err: any) {
        lastError = err;
        const latencyMs = Date.now() - startTime;
        const status = err?.status || err?.statusCode || (err?.response && err?.response?.status);
        const errMessage = String(err?.message || err || '');

        const isSkipCode =
          status === 429 ||
          status === 503 ||
          status === 404 ||
          errMessage.includes('429') ||
          errMessage.includes('RESOURCE_EXHAUSTED') ||
          errMessage.includes('quota') ||
          errMessage.includes('Quota') ||
          errMessage.includes('503') ||
          errMessage.includes('UNAVAILABLE') ||
          errMessage.includes('404') ||
          errMessage.includes('NOT_FOUND');

        if (isSkipCode) {
          console.warn(`[Gemini] Model ${model} returned skip code (${status || '429/503/404'}) in ${latencyMs}ms. Skipping immediately to next model.`);
          break; // Skip immediately to the next candidate model
        }

        if (attempt < 2) {
          console.warn(`[Gemini] Model ${model} attempt ${attempt} failed in ${latencyMs}ms (${errMessage.slice(0, 80)}). Retrying in 400ms...`);
          await new Promise((r) => setTimeout(r, 400));
        } else {
          console.warn(`[Gemini] Model ${model} attempt 2 failed in ${latencyMs}ms. Skipping to next model.`);
        }
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models failed.');
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
 * Server-side scenario-step matching (like VIAA-GOT checkAviationTemplateMatchEx):
 * - Checks keyword triggers of the current step and computes Levenshtein similarity (0-100).
 * - Final phraseologyScore = max(model score, similarity) only if similarity >= 50; otherwise keep the model score.
 * - Return matchedStep: true/false and similarity so the UI can show "Khớp bước X: Y%".
 */
function checkAviationTemplateMatchEx(
  transcribedText: string,
  expectedPhrase: string,
  currentPairIndex?: number
): { matchedStep: boolean; similarity: number } {
  if (!transcribedText || !expectedPhrase) {
    return { matchedStep: false, similarity: 0 };
  }

  const normTranscribed = normalizeForAviationMatching(transcribedText);
  const normExpected = normalizeForAviationMatching(expectedPhrase);
  const sim = computeAviationPhoneticSimilarity(transcribedText, expectedPhrase);

  const expWords = normExpected.split(/\s+/).filter(Boolean);
  const actWords = normTranscribed.split(/\s+/).filter(Boolean);

  let matchedWords = 0;
  for (const ew of expWords) {
    if (actWords.includes(ew)) matchedWords++;
  }
  const wordRatio = expWords.length > 0 ? (matchedWords / expWords.length) * 100 : 0;

  const similarity = Math.max(sim, Math.round(wordRatio));
  const matchedStep = similarity >= 50;

  return { matchedStep, similarity };
}

/**
 * Endpoint: POST /api/test-local-ai
 * Pings the local LLM server to test connectivity, model availability, and measure roundtrip latency.
 */
app.post('/api/test-local-ai', async (req, res) => {
  const { endpoint = 'http://localhost:11434/v1', model = 'qwen2.5:3b', apiKey } = req.body;
  const startTime = Date.now();
  const baseEndpoint = (endpoint || 'http://localhost:11434/v1').trim().replace(/\/+$/, '');

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
 * Endpoint: POST /api/evaluate-speech
 * Evaluates student's speech input against ICAO standard phraseology on a 100-point scale:
 * - < 80%: Not passed / requires retry
 * - 80% - 90%: Meets standard (Mức đạt)
 * - > 90%: Good / Outstanding (Mức tốt)
 */
app.post('/api/evaluate-speech', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      transcript,
      expectedText,
      expectedPhrase,
      currentPairIndex,
      role = 'Ground',
      studentLevel = 'intermediate', // beginner | intermediate | advanced
      localAiConfig,
    } = req.body;

    const targetPhrase = (expectedPhrase || expectedText || '').trim();
    const spoken = (transcript || '').trim();
    const passingThreshold = studentLevel === 'beginner' ? 30 : studentLevel === 'intermediate' ? 50 : 70;
    const levelName = studentLevel === 'beginner'
      ? 'Mức 1: Cơ bản (> 30% là đạt)'
      : studentLevel === 'intermediate'
      ? 'Mức 2: Tiêu chuẩn huấn luyện (> 50% là đạt)'
      : 'Mức 3: Đạt chuẩn đầu ra (> 70% là đạt)';

    // 1. If audioBase64 exists, ALWAYS send the audio to Gemini (local models are text-only and cannot hear audio).
    // Only if audioBase64 is NOT present and local AI is enabled, evaluate text locally.
    if (!audioBase64 && localAiConfig && localAiConfig.enabled && spoken) {
      try {
        console.log(`[Local AI] Evaluating text with local model '${localAiConfig.model}' at ${localAiConfig.endpoint}`);
        const localPrompt = `You are an expert ICAO Aviation Radio Telephony Examiner at Victoria Aviation Academy (VIAA).
Target Standard ICAO Phrase: "${targetPhrase || ''}"
Student Spoken: "${spoken}"
Student Level: ${studentLevel} (Passing threshold: > ${passingThreshold}%)

STEP 1: TRANSCRIPTION
Verbatim transcript: "${spoken}"

STEP 2: EVALUATION
Compare with the target ICAO phrase and score pronunciation and phraseology.

Output valid JSON only with this schema:
{
  "transcribedText": "${spoken}",
  "understoodAs": "${targetPhrase || spoken}",
  "overallScore": number (0-100),
  "pronunciationScore": number (0-100),
  "phraseologyScore": number (0-100),
  "mispronouncedWords": [{"word": string, "tip": string, "correctIcao": string}],
  "feedbackSummary": string (Vietnamese, max 2 sentences)
}`;
        const localResponseText = await callLocalAi(
          localAiConfig,
          [
            { role: 'system', content: 'You are an ICAO Aviation Radio Examiner. Output valid JSON only.' },
            { role: 'user', content: localPrompt },
          ],
          true
        );

        const cleaned = localResponseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(cleaned);

        const rawTranscribed = (parsed.transcribedText || spoken).trim();
        const matchResult = checkAviationTemplateMatchEx(rawTranscribed, targetPhrase || spoken, currentPairIndex);
        const templateSimilarity = matchResult.similarity;

        const modelPhraseology = Math.max(0, Math.min(100, Math.round(Number(parsed.phraseologyScore) || 75)));
        const phraseologyScore = templateSimilarity >= 50 ? Math.max(modelPhraseology, templateSimilarity) : modelPhraseology;
        const pronunciationScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pronunciationScore) || phraseologyScore)));
        const overallScore = Math.max(0, Math.min(100, Math.round(pronunciationScore * 0.45 + phraseologyScore * 0.55)));
        const isPassed = overallScore > passingThreshold;
        const requiresRetry = !isPassed;
        const grade: EvaluationGrade = overallScore >= (passingThreshold + 25) ? 'good' : isPassed ? 'passed' : 'not_passed';
        const rubricLevel = overallScore >= (passingThreshold + 25)
          ? `Mức Tốt (>${passingThreshold + 25}%)`
          : isPassed
          ? `Mức Đạt (>${passingThreshold}%)`
          : `Chưa Đạt (≤${passingThreshold}%)`;

        return res.json({
          overallScore,
          pronunciationScore,
          phraseologyScore,
          grade,
          isPassed,
          requiresRetry,
          transcribedText: rawTranscribed,
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
          matchedStep: matchResult.matchedStep,
          similarity: templateSimilarity,
          currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
          modelUsed: localAiConfig.model || 'local-ai',
        });
      } catch (localErr) {
        console.log('[Local AI] Offline or error, continuing with Gemini:', localErr);
      }
    }

    if (!ai) {
      // Offline fallback when no Gemini API is available
      const rawText = spoken;
      if (!rawText) {
        return res.json({
          overallScore: 0,
          pronunciationScore: 0,
          phraseologyScore: 0,
          grade: 'not_passed',
          isPassed: false,
          requiresRetry: true,
          transcribedText: '(Không nghe rõ – vui lòng nói lại)',
          understoodAs: '',
          phoneticToleranceApplied: '',
          mispronouncedWords: [],
          strengths: [],
          improvements: ['Vui lòng kiểm tra microphone và nói lại'],
          rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
          feedbackSummary: 'Không thu được tín hiệu âm thanh rõ ràng. Vui lòng nói lại vào microphone.',
        });
      }

      const simResult = calculateFastSimilarity(rawText, targetPhrase, studentLevel);
      const isPassed = simResult.similarity > passingThreshold;
      const grade: EvaluationGrade = simResult.similarity >= (passingThreshold + 25) ? 'good' : isPassed ? 'passed' : 'not_passed';
      const rubricLevel = simResult.similarity >= (passingThreshold + 25)
        ? `Mức Tốt (>${passingThreshold + 25}%)`
        : isPassed
        ? `Mức Đạt (>${passingThreshold}%)`
        : `Chưa Đạt (≤${passingThreshold}%)`;

      return res.json({
        overallScore: simResult.similarity,
        pronunciationScore: simResult.similarity,
        phraseologyScore: simResult.similarity,
        grade,
        isPassed,
        requiresRetry: !isPassed,
        transcribedText: rawText,
        understoodAs: simResult.understoodAs,
        phoneticToleranceApplied: simResult.phoneticToleranceApplied,
        mispronouncedWords: !isPassed ? [{ word: 'phraseology', tip: 'Cần phát âm rõ ràng, đúng khẩu lệnh ICAO tiêu chuẩn' }] : [],
        strengths: isPassed ? ['Khẩu lệnh đạt chuẩn quy định'] : ['Đã nỗ lực truyền tin'],
        improvements: !isPassed ? [`Điểm dưới ${passingThreshold}%: Vui lòng phát âm lại câu này`] : [],
        rubricLevel,
        feedbackSummary: isPassed
          ? `Đạt ${simResult.similarity}/100 điểm (> ${passingThreshold}% chuẩn ${levelName}). Đủ điều kiện tiếp tục câu tiếp theo.`
          : `Đạt ${simResult.similarity}/100 điểm (≤ ${passingThreshold}%). Chưa đạt chuẩn, yêu cầu phát âm lại câu này.`,
        matchedStep: simResult.matchedStep,
        similarity: simResult.similarity,
        currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
        modelUsed: 'offline',
      });
    }

    // If neither audio nor text was provided, return immediately without calling model
    if (!audioBase64 && !spoken) {
      return res.json({
        overallScore: 0,
        pronunciationScore: 0,
        phraseologyScore: 0,
        grade: 'not_passed' as EvaluationGrade,
        isPassed: false,
        requiresRetry: true,
        transcribedText: '(Không nghe rõ – vui lòng nói lại)',
        understoodAs: '',
        phoneticToleranceApplied: '',
        mispronouncedWords: [],
        strengths: [],
        improvements: ['Không thu được âm thanh hoặc khẩu lệnh, vui lòng phát âm lại'],
        rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
        feedbackSummary: 'Hệ thống không nhận được âm thanh. Vui lòng bật microphone và nói lại.',
      });
    }

    // 2. Multimodal Gemini Flash audio evaluation
    const modelToUse = audioBase64 ? 'gemini-2.5-flash' : FAST_TEXT_MODEL;

    // Prompt order: STEP 1 transcription first, STEP 2 evaluation.
    // No preliminary hint, no misspelled examples, standard English spelling verbatim.
    const promptText = `You are an expert ICAO Aviation Radio Telephony Examiner at Victoria Aviation Academy (VIAA).
You are evaluating an audio transmission between cockpit and ground headset operator.

Target Standard ICAO Phrase: "${expectedText || '(Free or Exam response)'}"
Role: ${role}
Student Level: ${studentLevel} (${levelName})

Follow these two steps strictly:

STEP 1: TRANSCRIPTION
Transcribe EXACTLY what the student said, verbatim, in standard English spelling.
Do NOT correct it to the target phrase, do NOT add missing words.
If silent or unintelligible return an empty string.

STEP 2: EVALUATION
Compare with the Target Standard ICAO Phrase and score:
- Evaluate pronunciation clarity and standard ICAO phraseology adherence.
- Student Level criteria:
  * beginner (Mức 1): Passing > 30%. Give credit if key aviation intent is communicated.
  * intermediate (Mức 2): Passing > 50%. Standard training standard.
  * advanced (Mức 3): Passing > 70%. Strict international airline standard.
- Identify up to 3 mispronounced words with specific tips for improvement.
- Provide a concise feedbackSummary in Vietnamese (maximum 2 sentences).
`;

    const userParts: any[] = [];
    if (audioBase64) {
      // Strip "data:...;base64," prefix and send mimeType without codec suffix (e.g. "audio/webm")
      const cleanData = audioBase64.replace(/^data:[^;]+;base64,/, '');
      const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
      let targetMime = 'audio/webm';
      if (cleanMime === 'audio/mp4' || cleanMime === 'audio/m4a') targetMime = 'audio/mp4';
      else if (cleanMime === 'audio/wav' || cleanMime === 'audio/x-wav') targetMime = 'audio/wav';
      else if (cleanMime === 'audio/ogg') targetMime = 'audio/ogg';
      else if (cleanMime === 'audio/mp3' || cleanMime === 'audio/mpeg') targetMime = 'audio/mp3';
      else if (cleanMime === 'audio/aac') targetMime = 'audio/aac';

      userParts.push({
        inlineData: {
          data: cleanData,
          mimeType: targetMime,
        },
      });
    }
    userParts.push({ text: promptText });

    const contents = [{ role: 'user', parts: userParts }];

    // 4. Small responseSchema with propertyOrdering:
    // transcribedText, understoodAs, overallScore, pronunciationScore, phraseologyScore, mispronouncedWords (max 3), feedbackSummary (Vietnamese, max 2 sentences)
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

    const response = await generateContentWithRetry({
      models: ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'],
      contents,
      config: {
        temperature: 0,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
        responseSchema: evaluationSchema,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const rawTranscribed = (parsed.transcribedText || '').trim();

    // 6. If transcribedText is empty, never substitute expectedText — return "(Không nghe rõ – vui lòng nói lại)" with isPassed=false
    if (!rawTranscribed) {
      return res.json({
        overallScore: 0,
        pronunciationScore: 0,
        phraseologyScore: 0,
        grade: 'not_passed' as EvaluationGrade,
        isPassed: false,
        requiresRetry: true,
        transcribedText: '(Không nghe rõ – vui lòng nói lại)',
        understoodAs: '',
        phoneticToleranceApplied: '',
        mispronouncedWords: [],
        strengths: [],
        improvements: ['Không thu được âm thanh rõ ràng hoặc học viên chưa nói, vui lòng phát âm lại'],
        rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
        feedbackSummary: 'Hệ thống không nghe rõ âm thanh hoặc tín hiệu quá nhỏ. Vui lòng nói lại rõ ràng vào microphone.',
      });
    }

    // Server-side scenario-step matching like VIAA-GOT checkAviationTemplateMatchEx
    const matchResult = checkAviationTemplateMatchEx(rawTranscribed, targetPhrase, currentPairIndex);
    const templateSimilarity = matchResult.similarity;

    // Final phraseologyScore = max(model score, similarity) only if similarity >= 50; otherwise keep the model score.
    const modelPhraseology = Math.max(0, Math.min(100, Math.round(Number(parsed.phraseologyScore) || 0)));
    const phraseologyScore = templateSimilarity >= 50 ? Math.max(modelPhraseology, templateSimilarity) : modelPhraseology;
    const pronunciationScore = Math.max(0, Math.min(100, Math.round(Number(parsed.pronunciationScore) || phraseologyScore)));
    const overallScore = Math.max(0, Math.min(100, Math.round(pronunciationScore * 0.45 + phraseologyScore * 0.55)));

    const isPassed = overallScore > passingThreshold;
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

    return res.json({
      overallScore,
      pronunciationScore,
      phraseologyScore,
      grade,
      isPassed,
      requiresRetry,
      transcribedText: rawTranscribed,
      understoodAs: (parsed.understoodAs || targetPhrase || '').trim(),
      phoneticToleranceApplied: '',
      mispronouncedWords,
      strengths,
      improvements,
      rubricLevel,
      feedbackSummary,
      matchedStep: matchResult.matchedStep,
      similarity: templateSimilarity,
      currentPairIndex: typeof currentPairIndex === 'number' ? currentPairIndex : undefined,
      modelUsed: (response as any).modelUsed || 'gemini-3.1-flash-lite',
    });
  } catch (error: any) {
    console.error('Error in /api/evaluate-speech:', error);
    const passingThreshold = req.body?.studentLevel === 'beginner' ? 30 : req.body?.studentLevel === 'advanced' ? 70 : 50;
    return res.json({
      overallScore: 0,
      pronunciationScore: 0,
      phraseologyScore: 0,
      grade: 'not_passed' as EvaluationGrade,
      isPassed: false,
      requiresRetry: true,
      transcribedText: '(Không nghe rõ – vui lòng nói lại)',
      understoodAs: '',
      phoneticToleranceApplied: '',
      mispronouncedWords: [],
      strengths: [],
      improvements: ['Vui lòng thử phát âm lại khẩu lệnh'],
      rubricLevel: `Chưa Đạt (≤${passingThreshold}%)`,
      feedbackSummary: 'Hệ thống chưa xử lý được âm thanh. Vui lòng thử lại.',
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

    // Try Local AI first if configured
    if (localAiConfig && localAiConfig.enabled) {
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
        console.log('[Local AI] Local server offline or unreachable, smoothly continuing with Gemini dialogue.');
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
      models: ['gemini-3.8-flash-lite-tts', 'gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash'],
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
              speechMetadata: {
                style: speaker === 'Cockpit'
                  ? 'Aviation captain, clear, concise interphone transmission'
                  : 'Ramp headset operator, crisp and direct',
              },
            },
          ],
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
