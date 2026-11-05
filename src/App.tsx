/**
 * AeroComms VIAA - Aviation Headset Communication Training & Examination
 * Victoria Aviation Academy (VIAA) · Grounded in VJC-VJAA-M-125 & VJC-GOP-M-01
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SCENARIOS, Scenario } from './data/scenarios';
import { ChatMessage, UserRole, PracticeMode, StudentLevel, PracticeSessionHistory, EvaluationResult, LocalAiConfig, getPassingThreshold } from './types';
import { Header } from './components/Header';
import { TopControls } from './components/TopControls';
import { DialogueChat } from './components/DialogueChat';
import { AudioInputControls } from './components/AudioInputControls';
import { EvaluationSummaryModal } from './components/EvaluationSummaryModal';
import { CurriculumModal } from './components/CurriculumModal';
import { ProwordGlossaryModal } from './components/ProwordGlossaryModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { LoginPage, UserSession } from './components/LoginPage';
import { InstructorIntroModal } from './components/InstructorIntroModal';
import { ReportModal } from './components/ReportModal';
import { playWavAudio, speakWithBrowserTts, playAudioFileUrl, getStaticScriptedAudioUrl } from './utils/audioPlayer';
import { DEFAULT_LMSTUDIO_API_KEY, detectBestAiEngine, DetectionResult } from './utils/aiEngineDetector';
import { transcribeWithFasterWhisper, synthesizeWithLocalAiTts, evaluateWithLocalDocker } from './utils/dockerAiClient';
import { RefreshCw, X, Zap } from 'lucide-react';

export default function App() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('scenario');
  const [studentLevel, setStudentLevel] = useState<StudentLevel>('intermediate');
  const [userRole, setUserRole] = useState<UserRole>('Ground');
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [karaokeEnabled, setKaraokeEnabled] = useState<boolean>(true);

  // Quick evaluation toggle (true: show full feedback, false: quick compact score badge)
  const [showDetailedEvaluation, setShowDetailedEvaluation] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aerocomms_show_detailed_eval');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aerocomms_show_detailed_eval', JSON.stringify(showDetailedEvaluation));
    } catch (e) {
      console.warn('Failed to save detailed eval setting:', e);
    }
  }, [showDetailedEvaluation]);

  // Local AI configuration (Ollama, LM Studio, vLLM)
  const [localAiConfig, setLocalAiConfig] = useState<LocalAiConfig>(() => {
    try {
      const saved = localStorage.getItem('aerocomms_local_ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.apiKey) parsed.apiKey = DEFAULT_LMSTUDIO_API_KEY;
        if (!parsed.lanHostIp) parsed.lanHostIp = '172.30.115.239';
        if (!parsed.openWebUiEndpoint) parsed.openWebUiEndpoint = 'http://172.30.115.239:8090/api';
        return parsed;
      }
      return {
        enabled: false,
        provider: 'lmstudio',
        endpoint: 'http://localhost:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: DEFAULT_LMSTUDIO_API_KEY,
        temperature: 0.1,
        lanHostIp: '172.30.115.239',
        openWebUiEndpoint: 'http://172.30.115.239:8090/api',
      };
    } catch {
      return {
        enabled: false,
        provider: 'lmstudio',
        endpoint: 'http://localhost:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: DEFAULT_LMSTUDIO_API_KEY,
        temperature: 0.1,
        lanHostIp: '172.30.115.239',
        openWebUiEndpoint: 'http://172.30.115.239:8090/api',
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aerocomms_local_ai_config', JSON.stringify(localAiConfig));
    } catch (e) {
      console.warn('Failed to save local ai config:', e);
    }
  }, [localAiConfig]);

  // Engine Auto-detection state upon login
  const [engineNotification, setEngineNotification] = useState<{
    preferred: 'local' | 'cloud';
    message: string;
    latencyMs?: number;
    model?: string;
    timestamp: number;
  } | null>(null);
  const [isDetectingEngine, setIsDetectingEngine] = useState<boolean>(false);

  const runEngineAutoDetection = useCallback(async (announce: boolean = true) => {
    setIsDetectingEngine(true);
    try {
      const result: DetectionResult = await detectBestAiEngine(localAiConfig);
      if (result.preferredEngine === 'local' && result.endpoint) {
        setLocalAiConfig((prev) => ({
          ...prev,
          enabled: true,
          provider: result.provider || 'lmstudio',
          endpoint: result.endpoint!,
          model: result.model || prev.model || 'google/gemma-4-e4b',
          apiKey: result.apiKey || prev.apiKey || DEFAULT_LMSTUDIO_API_KEY,
        }));
        if (announce) {
          setEngineNotification({
            preferred: 'local',
            message: result.message,
            latencyMs: result.latencyMs,
            model: result.model,
            timestamp: Date.now(),
          });
        }
      } else {
        setLocalAiConfig((prev) => ({
          ...prev,
          enabled: false,
        }));
        if (announce) {
          setEngineNotification({
            preferred: 'cloud',
            message: result.message,
            timestamp: Date.now(),
          });
        }
      }
    } catch {
      // Ignore network error on probe
    } finally {
      setIsDetectingEngine(false);
    }
  }, [localAiConfig]);

  // User Authentication State (User1: Test / 123, User2: Admin / VIAA)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('aerocomms_logged_in_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Instructor Introduction & Setup Modal state (shown immediately after login)
  const [isInstructorIntroOpen, setIsInstructorIntroOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const handleLoginSuccess = (session: UserSession) => {
    setCurrentUser(session);
    try {
      localStorage.setItem('aerocomms_logged_in_user', JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to persist user session:', e);
    }
    // Immediately display the Instructor Intro video & options menu after login
    setIsInstructorIntroOpen(true);
    // Auto-detect fastest engine upon login
    setTimeout(() => {
      runEngineAutoDetection(true);
    }, 450);
  };

  // Run initial auto-probe on mount if user is already logged in
  useEffect(() => {
    if (currentUser) {
      runEngineAutoDetection(false);
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    setEngineNotification(null);
    try {
      localStorage.removeItem('aerocomms_logged_in_user');
    } catch (e) {
      console.warn('Failed to clear user session:', e);
    }
  };

  // Active turn tracking
  const [currentPairIndex, setCurrentPairIndex] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [presetInputText, setPresetInputText] = useState<string>('');
  const [lastTranscribedText, setLastTranscribedText] = useState<string>('');
  const [pendingRetryTurn, setPendingRetryTurn] = useState<boolean>(false);
  const [turnRetryCount, setTurnRetryCount] = useState<number>(0);
  const [isExamSkipModalOpen, setIsExamSkipModalOpen] = useState<boolean>(false);

  // Client-side TTS cache: Map<`${speaker}:${text}`, { audioBase64: string | null; useBrowserFallback: boolean }>
  const ttsAudioCache = useRef<Map<string, { audioBase64: string | null; useBrowserFallback: boolean }>>(new Map());

  // Hidden Debug Panel state (toggle with Ctrl+Shift+D)
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);
  const [lastTurnDebug, setLastTurnDebug] = useState<{
    modelUsed?: string;
    audioSizeKb?: number;
    mimeType?: string;
    latencies: {
      evaluateMs: number;
      ttsMs: number;
      totalMs: number;
    };
    rawTranscribedText?: string;
    expectedPhrase?: string;
    similarity?: number;
    matchedStep?: boolean;
    currentPairIndex?: number;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setIsDebugOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Modals & Navigation state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState<boolean>(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [activeNavTab, setActiveNavTab] = useState<'practice' | 'curriculum' | 'glossary' | 'history'>('practice');
  // Collapsible training menu visibility (Default OFF per requirement)
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // History stored in localStorage
  const [historyList, setHistoryList] = useState<PracticeSessionHistory[]>(() => {
    try {
      const saved = localStorage.getItem('aerocomms_viaa_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveHistoryRef = useRef(historyList);
  useEffect(() => {
    saveHistoryRef.current = historyList;
    try {
      localStorage.setItem('aerocomms_viaa_history', JSON.stringify(historyList));
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e);
    }
  }, [historyList]);

  // Determine current expected turn in scenario or exam mode
  const currentPair = selectedScenario.dialoguePairs.find((p) => p.pairIndex === currentPairIndex);

  let currentExpectedTurn = null;
  if ((practiceMode === 'scenario' || practiceMode === 'exam') && currentPair) {
    if (userRole === 'Ground') {
      currentExpectedTurn = currentPair.groundTurn;
    } else {
      currentExpectedTurn = currentPair.cockpitTurn;
    }
  }

  // Direct audio, static pre-recorded file, or fallback voice playback with microphone lock (isAiSpeaking)
  const playDirectAudioOrVoice = async (text: string, speaker: 'Cockpit' | 'Ground', base64Audio?: string | null) => {
    if (!voiceEnabled || !text) return;
    setIsAiSpeaking(true);
    try {
      // 1. Check if a pre-recorded audio file exists for this scripted line (0ms latency, zero API cost)
      const staticAudioUrl = getStaticScriptedAudioUrl(text, speaker);
      if (staticAudioUrl) {
        await playAudioFileUrl(staticAudioUrl);
        return;
      }

      // 2. Direct Base64 audio returned by server
      const cacheKey = `${speaker}:${text}`;
      if (base64Audio) {
        ttsAudioCache.current.set(cacheKey, { audioBase64: base64Audio, useBrowserFallback: false });
        await playWavAudio(base64Audio);
        return;
      }
      await playAiVoice(text, speaker);
    } catch (e) {
      console.warn('Audio playback notice:', e);
      await speakWithBrowserTts(text, speaker);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  // Trigger AI voice playback with cache and microphone lock (isAiSpeaking)
  const playAiVoice = async (text: string, speaker: 'Cockpit' | 'Ground') => {
    if (!voiceEnabled || !text) return;
    setIsAiSpeaking(true);
    try {
      const cacheKey = `${speaker}:${text}`;
      const cached = ttsAudioCache.current.get(cacheKey);
      if (cached) {
        if (cached.audioBase64) {
          await playWavAudio(cached.audioBase64);
          return;
        } else {
          await speakWithBrowserTts(text, speaker);
          return;
        }
      }

      // If Docker Offline mode or Open WebUI is enabled, synthesize voice with localai-tts (:8081)
      if (localAiConfig.enabled && (localAiConfig.provider === 'docker' || localAiConfig.provider === 'openwebui' || localAiConfig.dockerOfflineEnabled)) {
        try {
          const ttsUrl = localAiConfig.localAiTtsEndpoint || (localAiConfig.lanHostIp ? `http://${localAiConfig.lanHostIp}:8081/v1` : 'http://localhost:8081/v1');
          const dockerTts = await synthesizeWithLocalAiTts(
            text,
            speaker,
            ttsUrl,
            localAiConfig.localAiTtsVoice
          );
          if (dockerTts.audioBase64) {
            ttsAudioCache.current.set(cacheKey, { audioBase64: dockerTts.audioBase64, useBrowserFallback: false });
            await playWavAudio(dockerTts.audioBase64);
            return;
          }
        } catch (dockerTtsErr) {
          console.warn('[Docker TTS notice - falling back to cloud TTS]:', dockerTtsErr);
        }
      }

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker }),
      });
      if (response.ok) {
        const data = await response.json();
        ttsAudioCache.current.set(cacheKey, {
          audioBase64: data.audioBase64 || null,
          useBrowserFallback: !!data.useBrowserFallback,
        });
        if (data.audioBase64) {
          await playWavAudio(data.audioBase64);
          return;
        }
      }
      await speakWithBrowserTts(text, speaker);
    } catch {
      await speakWithBrowserTts(text, speaker);
    } finally {
      setIsAiSpeaking(false);
    }
  };

  // Initialize or reset session
  const startSession = useCallback(
    async (scenario: Scenario, role: UserRole, mode: PracticeMode = practiceMode) => {
      setCurrentPairIndex(1);
      setMessages([]);
      setIsAiThinking(false);
      setIsEvaluating(false);
      setPendingRetryTurn(false);
      setPresetInputText('');
      setTurnRetryCount(0);

      const firstPair = scenario.dialoguePairs[0];
      if (!firstPair) return;

      const aiRole: UserRole = role === 'Ground' ? 'Cockpit' : 'Ground';

      // If in scenario or exam mode and AI is the initiator for Pair 1, trigger AI turn
      if ((mode === 'scenario' || mode === 'exam') && firstPair.expectedInitiator === aiRole) {
        const aiTurn = aiRole === 'Cockpit' ? firstPair.cockpitTurn : firstPair.groundTurn;
        setIsAiThinking(true);

        setTimeout(async () => {
          setIsAiThinking(false);
          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: aiRole,
            isUser: false,
            text: aiTurn.text,
            vietnamese: aiTurn.vietnamese,
            prowords: aiTurn.prowords,
            timestamp: Date.now(),
            pairIndex: 1,
          };
          setMessages([aiMsg]);
          await playAiVoice(aiTurn.text, aiRole);
        }, 600);
      } else if ((mode === 'scenario' || mode === 'exam') && firstPair.expectedInitiator === role) {
        const studentTurn = role === 'Ground' ? firstPair.groundTurn : firstPair.cockpitTurn;
        const initMsg: ChatMessage = {
          id: `msg-${Date.now()}-init`,
          sender: aiRole,
          isUser: false,
          text: `[BẮT ĐẦU TÌNH HUỐNG] ${scenario.title}. Bạn đóng vai ${role}. Vui lòng phát biểu lượt đầu tiên (Cặp #1): "${studentTurn.text}"`,
          vietnamese: studentTurn.vietnamese,
          timestamp: Date.now(),
          pairIndex: 1,
        };
        setMessages([initMsg]);
      }
    },
    [voiceEnabled, practiceMode]
  );

  useEffect(() => {
    startSession(selectedScenario, userRole, practiceMode);
  }, [selectedScenario, userRole, practiceMode]);

  // Handle student transmission (voice or text)
  // Handle student transmission (voice or text) via VIAA-GOT pipeline
  const handleStudentTransmit = async (spokenText: string, audioBase64?: string, mimeType?: string) => {
    const trimmedSpoken = spokenText.trim();
    if (!trimmedSpoken && !audioBase64) return;

    console.time('total');
    const totalStart = Date.now();
    console.time('record->upload');
    const audioSizeKb = audioBase64 ? Math.round(((audioBase64.length * 3) / 4 / 1024) * 10) / 10 : 0;
    console.timeEnd('record->upload');

    const studentRole = userRole;
    const aiRole: UserRole = studentRole === 'Ground' ? 'Cockpit' : 'Ground';

    const userMsgId = `msg-${Date.now()}-user`;
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      sender: studentRole,
      isUser: true,
      text: trimmedSpoken || '🎙️ [Đang nhận diện giọng nói...]',
      timestamp: Date.now(),
      pairIndex: currentPairIndex,
      audioBase64: audioBase64,
      isRetryAttempt: pendingRetryTurn,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsEvaluating(true);

    let evaluation: EvaluationResult | undefined = undefined;
    let evalLatencyMs = 0;

    let activeSpoken = trimmedSpoken;

    // If Docker Offline mode or Open WebUI is enabled and user sent audio, transcribe via Faster-Whisper (:8000)
    if (audioBase64 && localAiConfig.enabled && (localAiConfig.provider === 'docker' || localAiConfig.provider === 'openwebui' || localAiConfig.dockerOfflineEnabled)) {
      try {
        const whisperUrl = localAiConfig.whisperEndpoint || (localAiConfig.lanHostIp ? `http://${localAiConfig.lanHostIp}:8000/v1` : 'http://localhost:8000/v1');
        const whisperRes = await transcribeWithFasterWhisper(
          audioBase64,
          mimeType || 'audio/webm',
          whisperUrl,
          localAiConfig.whisperModel
        );
        if (whisperRes.text) {
          activeSpoken = whisperRes.text;
          setMessages((prev) =>
            prev.map((m) => (m.id === userMsgId ? { ...m, text: activeSpoken } : m))
          );
        }
      } catch (whisperErr) {
        console.warn('[Docker Whisper notice - falling back to cloud evaluation]:', whisperErr);
      }
    }

    try {
      // 1. Determine expectedText, aiReplyText, difficulty, history per VIAA-GOT PART 2
      const expectedText = currentExpectedTurn ? currentExpectedTurn.text : '';

      let aiReplyText = '';
      const activePair = (practiceMode === 'scenario' || practiceMode === 'exam')
        ? selectedScenario.dialoguePairs.find((p) => p.pairIndex === currentPairIndex)
        : null;
      const studentIsInitiator = activePair ? activePair.expectedInitiator === studentRole : false;

      if (practiceMode === 'scenario' || practiceMode === 'exam') {
        if (studentIsInitiator && activePair) {
          const aiTurn = aiRole === 'Cockpit' ? activePair.cockpitTurn : activePair.groundTurn;
          aiReplyText = aiTurn?.text || '';
        } else if (activePair) {
          const nextPair = selectedScenario.dialoguePairs.find((p) => p.pairIndex === currentPairIndex + 1);
          if (nextPair && nextPair.expectedInitiator === aiRole) {
            const nextAiTurn = aiRole === 'Cockpit' ? nextPair.cockpitTurn : nextPair.groundTurn;
            aiReplyText = nextAiTurn?.text || '';
          }
        }
      }

      const difficulty = studentLevel === 'beginner' ? 'easy' : studentLevel === 'advanced' ? 'hard' : 'normal';

      const history = messages.map((m) => ({
        sender: m.isUser ? 'user' : 'assistant',
        text: m.text,
      }));

      // 2. Evaluation pipeline: Direct client Docker Offline if active, or POST /api/evaluate-speech
      console.time('Speech evaluation');
      const evalStart = Date.now();

      // Attempt direct client-side evaluation with LocalAI / Open WebUI container if enabled
      if (activeSpoken && localAiConfig.enabled && (localAiConfig.provider === 'docker' || localAiConfig.provider === 'openwebui' || localAiConfig.dockerOfflineEnabled)) {
        try {
          const evalEndpoint = localAiConfig.provider === 'openwebui'
            ? (localAiConfig.openWebUiEndpoint || (localAiConfig.lanHostIp ? `http://${localAiConfig.lanHostIp}:8090/api` : 'http://172.30.115.239:8090/api'))
            : (localAiConfig.endpoint || 'http://localhost:8081/v1');
          const evalModel = localAiConfig.provider === 'openwebui'
            ? (localAiConfig.model || 'open-webui')
            : localAiConfig.model;
          const localResult = await evaluateWithLocalDocker(
            activeSpoken,
            expectedText,
            difficulty as any,
            evalEndpoint,
            evalModel,
            localAiConfig.apiKey
          );
          if (localResult && typeof localResult.overallScore === 'number') {
            const passingThreshold = getPassingThreshold(studentLevel);
            const overallScore = Math.max(0, Math.min(100, Math.round(localResult.overallScore)));
            const isPassed = overallScore >= passingThreshold;
            evaluation = {
              overallScore,
              pronunciationScore: Math.max(0, Math.min(100, Math.round(localResult.pronunciationScore ?? overallScore))),
              phraseologyScore: Math.max(0, Math.min(100, Math.round(localResult.phraseologyScore ?? overallScore))),
              grammarScore: overallScore,
              vocabularyScore: overallScore,
              templateScore: overallScore,
              grade: overallScore >= passingThreshold + 25 ? 'good' : isPassed ? 'passed' : 'not_passed',
              isPassed,
              requiresRetry: !isPassed,
              transcribedText: activeSpoken,
              understoodAs: expectedText || activeSpoken,
              mispronouncedWords: Array.isArray(localResult.mispronouncedWords) ? localResult.mispronouncedWords : [],
              strengths: isPassed ? ['Khẩu lệnh đạt chuẩn'] : ['Đã tiếp nhận'],
              improvements: !isPassed ? [`Điểm dưới ${passingThreshold}%`] : [],
              rubricLevel: isPassed ? 'Đạt' : 'Chưa đạt',
              feedbackSummary: localResult.feedbackSummary || (isPassed ? 'Khẩu lệnh đạt chuẩn.' : 'Chưa đạt chuẩn.'),
              assistantReply: aiReplyText || localResult.assistantReply || 'Roger.',
              modelUsed: `${evalModel || 'Local'} (${localAiConfig.provider === 'openwebui' ? 'Open WebUI WiFi' : 'Docker Offline'})`,
            };
            evalLatencyMs = Date.now() - evalStart;
          }
        } catch {
          // Smooth fallback to backend Gemini evaluation
        }
      }

      // If not evaluated locally, request evaluation from /api/evaluate-speech
      if (!evaluation) {
        // Do not send localhost or private LAN endpoint to remote cloud server to prevent ECONNREFUSED/timeout
        const isLocalhostEndpoint = localAiConfig.endpoint && (
          localAiConfig.endpoint.includes('localhost') ||
          localAiConfig.endpoint.includes('127.0.0.1') ||
          localAiConfig.endpoint.includes('172.') ||
          localAiConfig.endpoint.includes('192.168.') ||
          localAiConfig.endpoint.includes('10.')
        );
        const serverLocalAiConfig = (localAiConfig.enabled && !isLocalhostEndpoint && !audioBase64)
          ? localAiConfig
          : undefined;

        const evalResponse = await fetch('/api/evaluate-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: activeSpoken ? '' : (audioBase64 || ''),
            mimeType: mimeType || 'audio/webm',
            typedText: activeSpoken,
            history,
            expectedText,
            aiReplyText,
            aiSpeaker: aiRole,
            difficulty,
            practiceMode,
            scenarioTitle: selectedScenario.title,
            userRole: studentRole,
            voiceEnabled,
            maxOutputTokens: 650,
            currentPairIndex,
            studentLevel,
            localAiConfig: serverLocalAiConfig,
          }),
        });

        evalLatencyMs = Date.now() - evalStart;

        if (evalResponse.ok) {
          evaluation = await evalResponse.json();
        }
      }
      console.timeEnd('Speech evaluation');

      if (evaluation) {
        if (evaluation.transcribedText) {
          setLastTranscribedText(evaluation.transcribedText);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMsgId
              ? {
                  ...m,
                  evaluation,
                  text: evaluation?.transcribedText || (trimmedSpoken || evaluation?.understoodAs || 'Khẩu lệnh đã ghi nhận'),
                }
              : m
          )
        );

        setLastTurnDebug({
          modelUsed: evaluation.modelUsed || 'gemini-3.1-flash-lite',
          audioSizeKb,
          mimeType: mimeType || 'audio/webm',
          latencies: {
            evaluateMs: evalLatencyMs,
            ttsMs: 0,
            totalMs: Date.now() - totalStart,
          },
          rawTranscribedText: evaluation.rawTranscription || evaluation.transcribedText || trimmedSpoken,
          expectedPhrase: expectedText,
          similarity: evaluation.similarity ?? 0,
          matchedStep: evaluation.matchedStep,
          currentPairIndex,
        });
      }
    } catch (err) {
      console.log('[Evaluation] Speech evaluation notice:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId && m.text.includes('Đang nhận diện')
            ? { ...m, text: trimmedSpoken || 'Khẩu lệnh vô tuyến' }
            : m
        )
      );
    } finally {
      setIsEvaluating(false);
      console.timeEnd('total');
    }

    // 3. Pass/Fail check per VIAA-GOT PART 2
    const passedThisTurn = evaluation ? !!evaluation.isPassed : true;

    if (!passedThisTurn) {
      // Failed: require retry of the current turn
      setPendingRetryTurn(true);
      const newRetryCount = turnRetryCount + 1;
      setTurnRetryCount(newRetryCount);

      if (practiceMode === 'exam' && newRetryCount >= 2) {
        setIsExamSkipModalOpen(true);
        return;
      }

      // Speak repeat prompt if assistantReply is provided
      if (evaluation?.assistantReply) {
        const repeatText = evaluation.assistantReply;
        const aiRepeatMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai-repeat`,
          sender: aiRole,
          isUser: false,
          text: repeatText,
          vietnamese: 'Vui lòng nhắc lại khẩu lệnh tiêu chuẩn.',
          timestamp: Date.now(),
          pairIndex: currentPairIndex,
        };
        setMessages((prev) => [...prev, aiRepeatMsg]);
        await playDirectAudioOrVoice(repeatText, aiRole, evaluation.replyAudioBase64);
      }
      return;
    }

    // Passed turn! Clear retry flag and continue
    setPendingRetryTurn(false);
    setTurnRetryCount(0);

    // Scenario / Exam Mode handling
    if (practiceMode === 'scenario' || practiceMode === 'exam') {
      const activePair = selectedScenario.dialoguePairs.find((p) => p.pairIndex === currentPairIndex);
      if (!activePair) return;

      const studentIsInitiator = activePair.expectedInitiator === studentRole;

      if (studentIsInitiator) {
        // AI replies to complete this pair
        const aiTurn = aiRole === 'Cockpit' ? activePair.cockpitTurn : activePair.groundTurn;
        setIsAiThinking(true);

        setTimeout(async () => {
          setIsAiThinking(false);
          const aiMsg: ChatMessage = {
            id: `msg-${Date.now()}-ai`,
            sender: aiRole,
            isUser: false,
            text: aiTurn.text,
            vietnamese: aiTurn.vietnamese,
            prowords: aiTurn.prowords,
            timestamp: Date.now(),
            pairIndex: currentPairIndex,
          };
          setMessages((prev) => [...prev, aiMsg]);
          await playDirectAudioOrVoice(aiTurn.text, aiRole, evaluation?.replyAudioBase64);

          if (currentPairIndex < selectedScenario.dialoguePairs.length) {
            advanceToNextPair(currentPairIndex + 1);
          } else {
            // Completed all 10 pairs! Show summary modal
            setTimeout(() => {
              setIsSummaryModalOpen(true);
            }, 1000);
          }
        }, 350);
      } else {
        // Student answered AI's opening turn -> Pair finished!
        if (currentPairIndex < selectedScenario.dialoguePairs.length) {
          advanceToNextPair(currentPairIndex + 1);
        } else {
          setTimeout(() => {
            setIsSummaryModalOpen(true);
          }, 1000);
        }
      }
    } else {
      // Free Dialogue Mode: Instant AI response using assistantReply from evaluate-speech
      setIsAiThinking(true);
      const freeReply = evaluation?.assistantReply || 'Roger. Message understood. Standing by.';
      setTimeout(async () => {
        setIsAiThinking(false);
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: aiRole,
          isUser: false,
          text: freeReply,
          vietnamese: 'Đã nhận rõ. Sẵn sàng theo quy trình.',
          prowords: ['ROGER'],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        await playDirectAudioOrVoice(freeReply, aiRole, evaluation?.replyAudioBase64);
      }, 250);
    }
  };

  // Advance to next pair and trigger AI if initiator
  const advanceToNextPair = (nextPairIndex: number) => {
    setCurrentPairIndex(nextPairIndex);
    setPendingRetryTurn(false);
    setPresetInputText('');

    const nextPair = selectedScenario.dialoguePairs.find((p) => p.pairIndex === nextPairIndex);
    if (!nextPair) return;

    const aiRole: UserRole = userRole === 'Ground' ? 'Cockpit' : 'Ground';
    if (nextPair.expectedInitiator === aiRole) {
      const aiTurn = aiRole === 'Cockpit' ? nextPair.cockpitTurn : nextPair.groundTurn;
      setIsAiThinking(true);

      setTimeout(async () => {
        setIsAiThinking(false);
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: aiRole,
          isUser: false,
          text: aiTurn.text,
          vietnamese: aiTurn.vietnamese,
          prowords: aiTurn.prowords,
          timestamp: Date.now(),
          pairIndex: nextPairIndex,
        };
        setMessages((prev) => [...prev, aiMsg]);
        await playAiVoice(aiTurn.text, aiRole);
      }, 900);
    }
  };

  // Save session to history drawer
  const handleSaveToHistory = () => {
    const userEvaluations = messages.filter((m) => m.isUser && m.evaluation);
    let avg = 85;
    if (userEvaluations.length > 0) {
      const total = userEvaluations.reduce((sum, m) => sum + (m.evaluation?.overallScore || 0), 0);
      avg = Math.round(total / userEvaluations.length);
    }

    const threshold = getPassingThreshold(studentLevel);
    const grade = avg >= (threshold + 25) ? 'good' : avg > threshold ? 'passed' : 'not_passed';
    const rubricLevel = avg >= (threshold + 25)
      ? `Mức Tốt (>${threshold + 25}%)`
      : avg > threshold
      ? `Mức Đạt (>${threshold}%)`
      : `Chưa Đạt (≤${threshold}%)`;

    const newHistoryItem: PracticeSessionHistory = {
      id: `session-${Date.now()}`,
      date: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      scenarioId: selectedScenario.id,
      scenarioTitle: selectedScenario.title,
      practiceMode,
      userRole,
      studentLevel,
      overallScore: avg,
      totalPairsCompleted: currentPairIndex,
      messages: [...messages],
      grade,
      rubricLevel,
    };

    setHistoryList((prev) => [newHistoryItem, ...prev]);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen max-h-screen flex flex-col bg-white text-slate-900 font-sans overflow-hidden">
      {/* Sticky Training Session Bar - ALWAYS visible regardless of scroll */}
      <div className="shrink-0 z-50 bg-slate-950 text-white px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* MENU ON / OFF toggle button (Default OFF) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-xs border ${
              isMenuOpen
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isMenuOpen ? 'Nhấn để đóng Menu' : 'Nhấn để mở Menu điều khiển'}
          >
            <span className={`w-2 h-2 rounded-full ${isMenuOpen ? 'bg-slate-950 animate-ping' : 'bg-slate-500'}`} />
            <span>MENU: {isMenuOpen ? 'ON' : 'OFF'}</span>
          </button>

          {/* Title right next to menu button on the same line: IN HOA, IN ĐẬM */}
          <div className="min-w-0 flex items-center gap-2">
            {practiceMode === 'exam' ? (
              <span className="font-black uppercase tracking-wider text-amber-400 text-xs sm:text-sm md:text-base truncate drop-shadow-xs">
                ĐANG THỰC HIỆN BÀI KIỂM TRA
              </span>
            ) : (
              <span className="font-black uppercase tracking-wider text-white text-xs sm:text-sm md:text-base truncate drop-shadow-xs">
                BÀI {SCENARIOS.findIndex((s) => s.id === selectedScenario.id) + 1}: {selectedScenario.title.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Right side role & step badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 font-bold uppercase">
            {userRole === 'Ground' ? 'HEADSET MAN' : 'COCKPIT'}
          </span>
          {practiceMode !== 'free' && (
            <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono text-[10px] font-black tracking-wider shadow-2xs">
              BƯỚC {currentPairIndex}/{selectedScenario.dialoguePairs.length}
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Menu Section (Header, TopControls, Engine banner) - ONLY visible when isMenuOpen is true */}
      {isMenuOpen && (
        <div className="shrink-0 flex flex-col border-b border-slate-200 bg-white shadow-xl animate-fadeIn z-40 max-h-[75vh] overflow-y-auto">
          {/* VIAA Top Bar with Victoria Aviation Academy Logo */}
          <Header
            onNewSession={() => {
              startSession(selectedScenario, userRole, practiceMode);
              setIsMenuOpen(false);
            }}
            onOpenGlossary={() => {
              setIsGlossaryOpen(true);
              setIsMenuOpen(false);
            }}
            onOpenHistory={() => {
              setIsHistoryOpen(true);
              setIsMenuOpen(false);
            }}
            onOpenCurriculum={() => {
              setIsCurriculumOpen(true);
              setIsMenuOpen(false);
            }}
            onOpenInstructorIntro={() => {
              setIsInstructorIntroOpen(true);
              setIsMenuOpen(false);
            }}
            onOpenReport={() => {
              setIsReportModalOpen(true);
              setIsMenuOpen(false);
            }}
            activeTab={activeNavTab}
            setActiveTab={setActiveNavTab}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          {/* Control Strip: Option & Status Groups */}
          <TopControls
            selectedScenario={selectedScenario}
            onSelectScenario={(s) => setSelectedScenario(s)}
            practiceMode={practiceMode}
            onTogglePracticeMode={(mode) => {
              setPracticeMode(mode);
              startSession(selectedScenario, userRole, mode);
            }}
            studentLevel={studentLevel}
            onChangeStudentLevel={(lvl) => setStudentLevel(lvl)}
            userRole={userRole}
            onToggleUserRole={(role) => setUserRole(role)}
            voiceEnabled={voiceEnabled}
            onToggleVoice={() => setVoiceEnabled((v) => !v)}
            karaokeEnabled={karaokeEnabled}
            onToggleKaraoke={() => setKaraokeEnabled((k) => !k)}
            currentPairIndex={currentPairIndex}
            totalPairs={selectedScenario.dialoguePairs.length}
            showDetailedEvaluation={showDetailedEvaluation}
            onToggleDetailedEvaluation={() => setShowDetailedEvaluation((prev) => !prev)}
            localAiConfig={localAiConfig}
            onUpdateLocalAiConfig={(cfg) => setLocalAiConfig(cfg)}
            onOpenReport={() => setIsReportModalOpen(true)}
          />

          {/* Auto-Detect AI Engine Notification Banner */}
          {engineNotification && (
            <div
              className={`px-4 sm:px-6 py-2 border-t text-xs flex items-center justify-between gap-3 transition-all shrink-0 ${
                engineNotification.preferred === 'local'
                  ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                  : 'bg-sky-50/95 border-sky-300 text-sky-950'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {engineNotification.preferred === 'local' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md shadow-2xs border ${
                      engineNotification.preferred === 'local'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-sky-600 text-white border-sky-700'
                    }`}
                  >
                    {engineNotification.preferred === 'local' ? '⚡ AI Local Ưu Tiên' : '🌐 Gemini Cloud'}
                  </span>
                  <span className="text-xs font-semibold leading-tight">
                    {engineNotification.message}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLocalAiConfig((prev) => ({
                      ...prev,
                      enabled: !prev.enabled,
                    }));
                    setEngineNotification((prev) =>
                      prev
                        ? {
                            ...prev,
                            preferred: prev.preferred === 'local' ? 'cloud' : 'local',
                            message:
                              prev.preferred === 'local'
                                ? 'Đã chuyển thủ công sang Gemini 3.1 Flash Lite đám mây.'
                                : 'Đã chuyển thủ công sang Local AI nội bộ.',
                          }
                        : null
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  {localAiConfig.enabled ? 'Đổi sang Gemini Cloud' : 'Ưu tiên Local AI'}
                </button>

                <button
                  type="button"
                  onClick={() => runEngineAutoDetection(true)}
                  disabled={isDetectingEngine}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer border border-transparent hover:border-slate-300"
                  title="Dò tìm lại engine AI nhanh nhất (Auto-detect)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetectingEngine ? 'animate-spin text-amber-600' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setEngineNotification(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer"
                  title="Đóng thông báo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Conversation View - ONLY this area scrolls */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        <DialogueChat
          messages={messages}
          currentExpectedText={currentExpectedTurn ? currentExpectedTurn.text : null}
          currentExpectedVietnamese={currentExpectedTurn ? currentExpectedTurn.vietnamese : null}
          currentExpectedPronunciation={currentExpectedTurn ? currentExpectedTurn.pronunciationNotes || null : null}
          currentExpectedSpeaker={currentExpectedTurn ? currentExpectedTurn.speaker : null}
          userRole={userRole}
          practiceMode={practiceMode}
          karaokeEnabled={karaokeEnabled}
          onToggleKaraoke={() => setKaraokeEnabled((k) => !k)}
          selectedScenario={selectedScenario}
          isAiThinking={isAiThinking}
          isEvaluating={isEvaluating}
          pendingRetryTurn={pendingRetryTurn}
          showDetailedEvaluation={showDetailedEvaluation}
          onSelectPracticeSentence={(text) => setPresetInputText(text)}
          onRetryCurrentTurn={() => {
            if (currentExpectedTurn) {
              setPresetInputText(currentExpectedTurn.text);
            }
          }}
        />

        {/* Bottom Audio Input Controls (Toggle to Record) */}
        <AudioInputControls
          onTransmit={handleStudentTransmit}
          disabled={isAiThinking || isEvaluating || isAiSpeaking}
          expectedText={currentExpectedTurn ? currentExpectedTurn.text : null}
          userRole={userRole}
          presetText={presetInputText}
          pendingRetryTurn={pendingRetryTurn}
          lastTranscribedText={lastTranscribedText}
          isEvaluating={isEvaluating}
        />
      </main>

      {/* Modals */}
      <EvaluationSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        scenario={selectedScenario}
        userRole={userRole}
        practiceMode={practiceMode}
        studentLevel={studentLevel}
        messages={messages}
        onRestart={() => startSession(selectedScenario, userRole, practiceMode)}
        onSaveToHistory={handleSaveToHistory}
      />

      <CurriculumModal
        isOpen={isCurriculumOpen}
        onClose={() => setIsCurriculumOpen(false)}
        onSelectScenario={(sc) => {
          setSelectedScenario(sc);
          startSession(sc, userRole, practiceMode);
        }}
      />

      <ProwordGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyList={historyList}
        onClearHistory={() => setHistoryList([])}
        onLoadSessionToReview={(session) => {
          setMessages(session.messages);
          const found = SCENARIOS.find((s) => s.id === session.scenarioId);
          if (found) setSelectedScenario(found);
          setUserRole(session.userRole);
          setPracticeMode(session.practiceMode);
          setStudentLevel(session.studentLevel);
        }}
      />

      {/* Instructor Introduction Video & 4-Option Course Setup Modal */}
      <InstructorIntroModal
        isOpen={isInstructorIntroOpen}
        onClose={() => setIsInstructorIntroOpen(false)}
        onStartTraining={({ scenario, practiceMode: mode, studentLevel: lvl, userRole: role }) => {
          setSelectedScenario(scenario);
          setPracticeMode(mode);
          setStudentLevel(lvl);
          setUserRole(role);
          setIsInstructorIntroOpen(false);
          startSession(scenario, role, mode);
        }}
        currentScenario={selectedScenario}
        currentPracticeMode={practiceMode}
        currentStudentLevel={studentLevel}
        currentUserRole={userRole}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        selectedScenario={selectedScenario}
        practiceMode={practiceMode}
        studentLevel={studentLevel}
        userRole={userRole}
        messages={messages}
        currentUser={currentUser}
      />

      {/* Exam Mode 2-Attempt Skip/Retry Modal */}
      {isExamSkipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Bài Kiểm Tra Quá Trình (Exam Mode)</h3>
                <p className="text-xs text-slate-500">Cặp câu #{currentPairIndex} chưa đạt sau 2 lần thử</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Hệ thống ghi nhận bạn đã lặp lại 2 lần nhưng chưa đạt tiêu chuẩn. Bạn muốn tiếp tục thử lại lần nữa hay chuyển sang câu hỏi tiếp theo để hoàn thành đủ 10 cặp phản hồi?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsExamSkipModalOpen(false);
                  setTurnRetryCount(0);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Thử lại lần nữa
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExamSkipModalOpen(false);
                  setTurnRetryCount(0);
                  if (currentPairIndex < selectedScenario.dialoguePairs.length) {
                    advanceToNextPair(currentPairIndex + 1);
                  } else {
                    setIsSummaryModalOpen(true);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Chuyển câu tiếp theo ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Debug Inspector Panel (Ctrl+Shift+D) */}
      {isDebugOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-xl shadow-2xl p-4 text-xs font-mono animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">AeroComms Turn Inspector</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Ctrl+Shift+D</span>
              <button
                type="button"
                onClick={() => setIsDebugOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng Inspector"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {lastTurnDebug ? (
            <div className="space-y-2.5 text-[11px]">
              <div className="flex justify-between items-center bg-slate-800/80 px-2 py-1.5 rounded">
                <span className="text-slate-400">Model Engine:</span>
                <span className="font-semibold text-sky-300">{lastTurnDebug.modelUsed || 'gemini-3.1-flash-lite'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/60 p-2 rounded">
                  <div className="text-[10px] text-slate-400">Audio Payload</div>
                  <div className="font-bold text-amber-300 mt-0.5">
                    {lastTurnDebug.audioSizeKb ? `${lastTurnDebug.audioSizeKb} KB` : 'Text only'}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate">{lastTurnDebug.mimeType || 'audio/webm'}</div>
                </div>

                <div className="bg-slate-800/60 p-2 rounded">
                  <div className="text-[10px] text-slate-400">Total Turn Latency</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{lastTurnDebug.latencies.totalMs} ms</div>
                  <div className="text-[9px] text-slate-500">
                    Eval: {lastTurnDebug.latencies.evaluateMs}ms | TTS: {lastTurnDebug.latencies.ttsMs}ms
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded space-y-1">
                <div className="text-[10px] text-slate-400">Speech-To-Text (Verbatim heard):</div>
                <div className="text-slate-200 font-sans italic bg-slate-900/80 px-2 py-1 rounded border border-slate-700/50">
                  "{lastTurnDebug.rawTranscribedText || '(Trống)'}"
                </div>
              </div>

              <div className="bg-slate-800/60 p-2 rounded space-y-1">
                <div className="text-[10px] text-slate-400">Target Standard Phrase:</div>
                <div className="text-slate-200 font-sans italic bg-slate-900/80 px-2 py-1 rounded border border-slate-700/50">
                  "{lastTurnDebug.expectedPhrase || '(Tự do)'}"
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded">
                <span className="text-slate-400">Template Similarity:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${lastTurnDebug.similarity && lastTurnDebug.similarity >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {lastTurnDebug.similarity ?? 0}%
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${lastTurnDebug.matchedStep ? 'bg-emerald-900/80 text-emerald-300' : 'bg-red-900/80 text-red-300'}`}>
                    {lastTurnDebug.matchedStep ? 'KHỚP BƯỚC' : 'CHƯA KHỚP'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Chưa có dữ liệu lượt thoại nào. Hãy bấm Push-To-Talk để ghi âm hoặc gửi tin nhắn.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
