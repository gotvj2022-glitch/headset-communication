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
import { playWavAudio, speakWithBrowserTts } from './utils/audioPlayer';
import { DEFAULT_LMSTUDIO_API_KEY, detectBestAiEngine, DetectionResult } from './utils/aiEngineDetector';
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
        return parsed;
      }
      return {
        enabled: false,
        provider: 'lmstudio',
        endpoint: 'http://localhost:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: DEFAULT_LMSTUDIO_API_KEY,
        temperature: 0.1,
      };
    } catch {
      return {
        enabled: false,
        provider: 'lmstudio',
        endpoint: 'http://localhost:1234/v1',
        model: 'google/gemma-4-e4b',
        apiKey: DEFAULT_LMSTUDIO_API_KEY,
        temperature: 0.1,
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

  // Direct audio or fallback voice playback with microphone lock (isAiSpeaking)
  const playDirectAudioOrVoice = async (text: string, speaker: 'Cockpit' | 'Ground', base64Audio?: string | null) => {
    if (!voiceEnabled || !text) return;
    setIsAiSpeaking(true);
    try {
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

      // 2. Single POST /api/evaluate-speech (inline TTS included)
      console.time('Gemini evaluate');
      const evalStart = Date.now();
      const evalResponse = await fetch('/api/evaluate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audioBase64 || '',
          mimeType: mimeType || 'audio/webm',
          typedText: trimmedSpoken,
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
          localAiConfig: audioBase64 ? undefined : localAiConfig,
        }),
      });

      evalLatencyMs = Date.now() - evalStart;
      console.timeEnd('Gemini evaluate');

      if (evalResponse.ok) {
        evaluation = await evalResponse.json();
      }

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
      {/* VIAA Top Bar with Victoria Aviation Academy Logo */}
      <Header
        onNewSession={() => startSession(selectedScenario, userRole, practiceMode)}
        onOpenGlossary={() => setIsGlossaryOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCurriculum={() => setIsCurriculumOpen(true)}
        onOpenInstructorIntro={() => setIsInstructorIntroOpen(true)}
        activeTab={activeNavTab}
        setActiveTab={setActiveNavTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Control Strip: Option & Status Groups (Frozen/Pinned at top) */}
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
      />

      {/* Auto-Detect AI Engine Notification Banner */}
      {engineNotification && (
        <div
          className={`px-4 sm:px-6 py-2 border-b text-xs flex items-center justify-between gap-3 transition-all shrink-0 animate-fadeIn ${
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
            {/* Quick toggle to opposite engine */}
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
