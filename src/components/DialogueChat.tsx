import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessage, UserRole, PracticeMode } from '../types';
import { Scenario } from '../data/scenarios';
import {
  Volume2,
  Plane,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  Award,
  ChevronDown,
  Focus,
  Radio
} from 'lucide-react';
import { playWavAudio, speakWithBrowserTts } from '../utils/audioPlayer';

interface DialogueChatProps {
  messages: ChatMessage[];
  currentExpectedText: string | null;
  currentExpectedVietnamese: string | null;
  currentExpectedPronunciation: string | null;
  currentExpectedSpeaker: 'Cockpit' | 'Ground' | null;
  userRole: UserRole;
  practiceMode: PracticeMode;
  karaokeEnabled: boolean;
  onToggleKaraoke: () => void;
  selectedScenario: Scenario;
  isAiThinking: boolean;
  isEvaluating: boolean;
  pendingRetryTurn: boolean;
  showDetailedEvaluation?: boolean;
  onSelectPracticeSentence?: (text: string) => void;
  onRetryCurrentTurn?: () => void;
}

export const DialogueChat: React.FC<DialogueChatProps> = ({
  messages,
  currentExpectedText,
  currentExpectedVietnamese,
  currentExpectedPronunciation,
  currentExpectedSpeaker,
  userRole,
  practiceMode,
  karaokeEnabled,
  onToggleKaraoke,
  isAiThinking,
  isEvaluating,
  pendingRetryTurn,
  showDetailedEvaluation = true,
  onSelectPracticeSentence,
  onRetryCurrentTurn,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageElementRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [focusedMessageIds, setFocusedMessageIds] = useState<Set<string>>(new Set());
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [clickedMessageId, setClickedMessageId] = useState<string | null>(null);
  const [manuallyExpandedEvalIds, setManuallyExpandedEvalIds] = useState<Set<string>>(new Set());

  const toggleEvalExpansion = (msgId: string) => {
    setManuallyExpandedEvalIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  /**
   * Dynamic 2-Chat Focus Calculation:
   * Only the 2 messages in focus are displayed at 100% opacity.
   * - At bottom: The 2 latest messages are in focus.
   * - When scrolled: The 2 messages closest to viewport center are in focus.
   * - All other messages fade out (opacity-30, blur-[0.4px]).
   * - Hovering or clicking any message immediately reveals it at 100% opacity.
   */
  const updateFocusedMessages = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Check if user scrolled away from bottom
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottomBtn(isUp);

    // If 2 or fewer messages, all are focused
    if (messages.length <= 2) {
      setFocusedMessageIds(new Set(messages.map((m) => m.id)));
      return;
    }

    // If near bottom (< 60px), focus on the 2 latest messages
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    if (isNearBottom) {
      const latestTwo = messages.slice(-2).map((m) => m.id);
      setFocusedMessageIds(new Set(latestTwo));
      return;
    }

    // User scrolled through history: Find the 2 messages closest to viewport center
    const viewportCenter = scrollTop + clientHeight / 2;
    const messageDistances: { id: string; distance: number }[] = [];

    messages.forEach((msg) => {
      const el = messageElementRefs.current.get(msg.id);
      if (el) {
        const elementCenter = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(elementCenter - viewportCenter);
        messageDistances.push({ id: msg.id, distance });
      }
    });

    if (messageDistances.length <= 2) {
      setFocusedMessageIds(new Set(messageDistances.map((m) => m.id)));
      return;
    }

    // Sort ascending by distance to center
    messageDistances.sort((a, b) => a.distance - b.distance);

    // Pick top 2 closest
    const closestTwo = messageDistances.slice(0, 2).map((m) => m.id);
    setFocusedMessageIds(new Set(closestTwo));
  }, [messages]);

  // Recalculate focus on scroll
  const handleScroll = () => {
    updateFocusedMessages();
  };

  // Auto-scroll when new messages arrive unless user scrolled up
  useEffect(() => {
    if (!showScrollBottomBtn) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Update focus on new messages
    setTimeout(() => {
      updateFocusedMessages();
    }, 100);
  }, [messages, isAiThinking, isEvaluating, showScrollBottomBtn, updateFocusedMessages]);

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottomBtn(false);
    setTimeout(() => {
      updateFocusedMessages();
    }, 150);
  };

  const handlePlayMessageAudio = async (msg: ChatMessage) => {
    if (msg.audioBase64) {
      await playWavAudio(msg.audioBase64);
    } else {
      await speakWithBrowserTts(msg.text, msg.sender);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50 radio-static-bg">
      {/* Main Messages Stream with custom scrollbar - ONLY this div scrolls */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-6 space-y-5 scroll-smooth relative"
        style={{ scrollbarGutter: 'stable' }}
      >
        {messages.length === 0 ? (
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 text-slate-500 max-w-lg mx-auto">
            {/* Dual animated avatars welcome illustration using video clips */}
            <div className="flex items-center justify-center gap-6 mb-5">
              <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-500 bg-slate-900 shadow-md animate-avatar-float animate-avatar-glow relative">
                <video
                  src="/assets/aistudio/captain_1b8679c5.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-1 text-center">
                  <span className="text-[9px] font-mono font-bold text-amber-300">CAPTAIN</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-slate-400">RADIO COMMS</span>
              </div>
              <div className="w-20 sm:w-24 h-28 sm:h-32 rounded-2xl overflow-hidden border-2 border-red-500 bg-slate-900 shadow-md animate-avatar-float animate-avatar-user-glow relative">
                <video
                  src="/assets/aistudio/headsetman_fcdb9adc.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 p-1 text-center">
                  <span className="text-[9px] font-mono font-bold text-red-300">HEADSET MAN</span>
                </div>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Đã Sẵn Sàng Thiết Lập Đàm Thoại ({practiceMode === 'exam' ? 'Kiểm Tra Quá Trình' : practiceMode === 'free' ? 'Đối Thoại Tự Do' : 'Kịch Bản Chuẩn'})
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn đang đóng vai <span className="text-red-600 font-bold">{userRole === 'Ground' ? 'Headset Man (Thợ máy mặt đất)' : 'Phi công (Cockpit)'}</span>.
              {practiceMode === 'exam'
                ? ' Trả lời tình huống phản xạ tự do nhưng bám sát mục tiêu bài học để được chấm điểm thang 100.'
                : ' Bấm nút Micro bên dưới để bắt đầu khẩu lệnh theo chuẩn ICAO.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.isUser;
            const isCockpit = msg.sender === 'Cockpit';
            const evaluation = msg.evaluation;
            const isFailed = evaluation && evaluation.overallScore < 80;

            // Check if this message is one of the 2 focused messages OR currently hovered / clicked
            const isAutoFocused = focusedMessageIds.has(msg.id);
            const isHovered = hoveredMessageId === msg.id;
            const isClicked = clickedMessageId === msg.id;
            const isClear = isAutoFocused || isHovered || isClicked;

            return (
              <div
                key={msg.id}
                ref={(el) => {
                  if (el) {
                    messageElementRefs.current.set(msg.id, el);
                  } else {
                    messageElementRefs.current.delete(msg.id);
                  }
                }}
                onMouseEnter={() => setHoveredMessageId(msg.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
                onClick={() => setClickedMessageId(isClicked ? null : msg.id)}
                className={`w-full flex transition-all duration-300 ${
                  isUser ? 'justify-end' : 'justify-start'
                } ${
                  isClear
                    ? 'opacity-100 filter-none scale-100 z-10'
                    : 'opacity-30 filter blur-[0.4px] grayscale-[25%] hover:opacity-100 hover:filter-none hover:grayscale-0 cursor-pointer'
                }`}
                title={!isClear ? 'Rà chuột hoặc bấm vào để xem rõ nội dung chat này' : undefined}
              >
                {/* Responsive Row: Layout matches User Reference Image 3 */}
                <div
                  className={`flex items-start gap-2.5 sm:gap-3.5 max-w-3xl ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* USER TURN: Dynamic Video Avatar when active, Static Thumbnail when inactive */}
                  {isUser && (
                    <div className={`shrink-0 flex flex-col items-center select-none mt-5 ${
                      isClear ? 'animate-avatar-float animate-avatar-user-glow' : ''
                    }`}>
                      <div className={`relative w-16 sm:w-24 md:w-28 h-24 sm:h-36 md:h-40 rounded-2xl overflow-hidden border-2 ${
                        isCockpit ? 'border-amber-400 bg-amber-950' : 'border-red-500 bg-red-950'
                      } shadow-md transition-all duration-300 ${isClear ? 'group-hover:scale-105' : 'filter brightness-90'}`}>
                        {isClear ? (
                          <video
                            src={isCockpit ? "/assets/aistudio/captain_1b8679c5.mp4" : "/assets/aistudio/headsetman_fcdb9adc.mp4"}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <img
                            src={isCockpit ? "/assets/aistudio/image_a010d445.png" : "/assets/aistudio/image_d903d17a.png"}
                            alt={isCockpit ? "Captain thumbnail" : "Headset Man thumbnail"}
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {/* Radio indicator */}
                        <div className="absolute top-1.5 right-1.5 flex items-center justify-center">
                          {isClear ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping absolute" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 relative border border-white" />
                            </>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400 relative border border-white/60" />
                          )}
                        </div>
                        {/* Role tag overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent p-1.5 text-center">
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider block">
                            {isCockpit ? 'BẠN (CAPTAIN)' : 'BẠN (HEADSET)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CHAT BUBBLE CONTAINER */}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-md sm:max-w-xl`}>
                    {/* Speaker Header */}
                    <div className="flex items-center gap-2 mb-1 px-1 text-xs font-mono">
                      {isCockpit ? (
                        <span className="flex items-center gap-1 font-bold text-amber-600">
                          <Plane className="w-3.5 h-3.5" />
                          <span>COCKPIT</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({isUser ? 'Bạn' : 'AI Tổ bay'})
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-bold text-red-600">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>GROUND</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({isUser ? 'Bạn' : 'AI Headset'})
                          </span>
                        </span>
                      )}
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>

                      {/* Active Focus Pill Indicator */}
                      {isAutoFocused && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          <Focus className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Đang xem</span>
                        </span>
                      )}
                    </div>

                    {/* Bubble Body */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        isUser
                          ? isFailed
                            ? 'bg-red-50 border-red-300 text-slate-900 rounded-tr-xs shadow-xs ring-2 ring-red-400/20'
                            : isCockpit
                            ? 'bg-amber-50/90 border-amber-300 text-slate-900 rounded-tr-xs shadow-xs'
                            : 'bg-rose-50/90 border-rose-300 text-slate-900 rounded-tr-xs shadow-xs'
                          : isCockpit
                          ? 'bg-white border-amber-200 text-slate-900 rounded-tl-xs shadow-xs'
                          : 'bg-white border-red-200 text-slate-900 rounded-tl-xs shadow-xs'
                      } relative`}
                    >
                      {/* Primary Radio English Phrase or Active Processing Indicator */}
                      <div className="flex items-start justify-between gap-3">
                        {isUser && !msg.evaluation && (isEvaluating || msg.text.includes('Đang nhận diện') || msg.text.includes('Đang gửi âm thanh')) ? (
                          <div className="flex items-center gap-2.5 py-1 text-red-700 animate-pulse">
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold font-mono">
                                🎙️ Đang gửi âm thanh tới LLM xử lý nhanh nhất...
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">
                                LLM Gemini siêu nhanh đang chuyển đổi giọng đọc thành văn bản (Speech-to-Text)...
                              </span>
                            </div>
                          </div>
                        ) : isUser && msg.evaluation ? (
                          <div className="flex flex-col gap-2 w-full">
                            {/* Line 1: What was heard (transcribedText verbatim from LLM) */}
                            <div className="flex items-start gap-2 bg-slate-900/5 p-2 rounded-xl border border-slate-200/80">
                              <span className="text-[10px] font-mono font-bold text-white bg-slate-800 uppercase tracking-wider shrink-0 px-2 py-0.5 rounded shadow-2xs mt-0.5">
                                LLM Nhận Dạng
                              </span>
                              <p className="text-sm sm:text-base font-bold tracking-wide font-mono leading-relaxed select-text text-slate-950">
                                "{msg.evaluation.transcribedText || msg.text}"
                              </p>
                            </div>

                            {/* Line 2: Standard phrase understood (understoodAs) */}
                            {msg.evaluation.understoodAs && (
                              <div className="flex items-start gap-2 pt-0.5 border-t border-slate-200/60">
                                <span className="text-[10px] font-mono font-bold text-sky-800 uppercase tracking-wider shrink-0 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 mt-0.5">
                                  Chuẩn ICAO
                                </span>
                                <p className="text-xs sm:text-sm font-semibold tracking-wide font-mono leading-relaxed select-text text-sky-950">
                                  "{msg.evaluation.understoodAs}"
                                </p>
                              </div>
                            )}

                            {/* Matched step indicator: Khớp bước X: Y% */}
                            {msg.evaluation.similarity !== undefined && (
                              <div className="flex items-center gap-2 pt-1">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                    (msg.evaluation.similarity ?? 0) >= 50
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}
                                >
                                  Khớp bước {msg.pairIndex || msg.evaluation.currentPairIndex || 1}: {msg.evaluation.similarity}%
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm sm:text-base font-bold tracking-wide font-mono leading-relaxed select-text text-slate-900">
                            "{msg.text}"
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayMessageAudio(msg);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors shrink-0 cursor-pointer"
                          title="Nghe lại câu thoại"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Live loading indicator badge before evaluation is ready */}
                      {isUser && !msg.evaluation && (isEvaluating || msg.text.includes('Đang nhận diện')) && (
                        <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-[11px] text-amber-900 animate-pulse">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                            <span>Đang phân tích phát âm đa phương thức...</span>
                          </div>
                          <span className="font-mono text-[10px] bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950 font-bold">
                            Dual-Engine
                          </span>
                        </div>
                      )}

                      {/* Vietnamese translation */}
                      {msg.vietnamese && (
                        <p className="mt-1.5 text-xs text-slate-600 italic">
                          {msg.vietnamese}
                        </p>
                      )}

                      {/* Proword tags if present */}
                      {msg.prowords && msg.prowords.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {msg.prowords.map((pw) => (
                            <span
                              key={pw}
                              className="px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-200"
                            >
                              PROWORD: {pw}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pronunciation Evaluation Card (Attached to user messages) */}
                      {evaluation && (() => {
                        // In Quick Evaluation mode (showDetailedEvaluation === false), default to collapsed unless clicked
                        const isLocallyToggled = manuallyExpandedEvalIds.has(msg.id);
                        const isDetailVisible = showDetailedEvaluation ? !isLocallyToggled : isLocallyToggled;
                        const isPassed = evaluation.isPassed !== undefined ? evaluation.isPassed : evaluation.overallScore >= 50;
                        const isFailed = !isPassed;

                        return (
                          <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">Đánh giá phát âm AI:</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEvalExpansion(msg.id);
                                  }}
                                  className="text-[10px] text-slate-500 hover:text-red-700 font-semibold underline cursor-pointer ml-1"
                                  title={isDetailVisible ? 'Thu gọn phần nhận xét' : 'Mở rộng nhận xét chi tiết'}
                                >
                                  {isDetailVisible ? 'Thu gọn ▲' : 'Xem nhận xét ▼'}
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-black font-mono border ${
                                    isPassed
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                                  }`}
                                >
                                  {evaluation.overallScore}/100 ĐIỂM
                                </span>
                                <span className="text-[11px] font-bold text-slate-600">
                                  ({evaluation.rubricLevel})
                                </span>
                              </div>
                            </div>

                            {/* Explicit Warning if turn failed according to level threshold */}
                            {isFailed && (
                              <div className="p-2.5 rounded-lg bg-red-100/90 border border-red-300 text-red-900 text-[11px] font-medium flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                                  <span>
                                    <strong>Chưa đạt chuẩn yêu cầu:</strong> {evaluation.feedbackSummary || 'Hãy phát âm lại câu này cho chuẩn xác trước khi tiếp tục.'}
                                  </span>
                                </div>
                                {onRetryCurrentTurn && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRetryCurrentTurn();
                                    }}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-colors whitespace-nowrap shadow-xs flex items-center gap-1 cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Lặp lại câu này</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Smart Phonetic Recognition Feedback (Vietnamese ESL Tolerance) */}
                            {(evaluation.understoodAs || evaluation.phoneticToleranceApplied) && (
                              <div className="p-2.5 rounded-lg bg-sky-50/90 border border-sky-200 text-[11px] space-y-1">
                                <div className="flex items-center gap-1.5 text-sky-900 font-semibold flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-200 text-sky-800 font-bold uppercase tracking-wider">
                                    AI Nhận diện ngữ âm & ngữ nghĩa
                                  </span>
                                  {evaluation.understoodAs && (
                                    <span>
                                      ➔ Khẩu lệnh chuẩn: <strong className="font-mono text-sky-950 font-bold">"{evaluation.understoodAs}"</strong>
                                    </span>
                                  )}
                                </div>
                                {evaluation.transcribedText && evaluation.understoodAs && evaluation.transcribedText.toLowerCase().trim() !== evaluation.understoodAs.toLowerCase().trim() && (
                                  <div className="text-slate-600 pl-1 text-[11px]">
                                    Âm thanh ghi nhận: <span className="italic font-mono text-slate-800">"{evaluation.transcribedText}"</span> ➔ Hệ thống hiểu: <span className="font-semibold text-sky-800 font-mono">"{evaluation.understoodAs}"</span>
                                  </div>
                                )}
                                {evaluation.phoneticToleranceApplied && (
                                  <div className="text-sky-700 pl-1 text-[10px] font-medium flex items-center gap-1">
                                    <span>✓ Dung sai ngữ âm ESL: {evaluation.phoneticToleranceApplied}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Detailed Evaluation Section (Collapsible in Quick Evaluation mode) */}
                            {isDetailVisible && (
                              <div className="space-y-2 animate-fadeIn pt-1">
                                {/* Word-by-word mispronunciation list */}
                                {evaluation.mispronouncedWords && evaluation.mispronouncedWords.length > 0 ? (
                                  <div className="bg-white rounded-lg p-2.5 border border-slate-200 space-y-1.5 shadow-xs">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      Các từ cần lưu ý phát âm:
                                    </span>
                                    <div className="space-y-1">
                                      {evaluation.mispronouncedWords.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-mono font-bold text-red-600 mr-1 underline">
                                              {item.word}
                                            </span>
                                            <span className="text-slate-700">→ {item.tip}</span>
                                            {item.correctIcao && (
                                              <span className="text-sky-700 font-semibold ml-1">
                                                (Chuẩn: <span className="font-mono">{item.correctIcao}</span>)
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50/70 p-2 rounded border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>
                                      {evaluation.overallScore > 90
                                        ? 'Mức Tốt: Phát âm chuẩn xác, khẩu lệnh rõ ràng theo tiêu chuẩn ICAO.'
                                        : 'Mức Đạt: Đã đạt chuẩn yêu cầu huấn luyện.'}
                                    </span>
                                  </div>
                                )}

                                {/* Pedagogical feedback */}
                                {evaluation.feedbackSummary && (
                                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                                    💡 {evaluation.feedbackSummary}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* AI TURN: Dynamic Video Avatar when active, Static Thumbnail when inactive */}
                  {!isUser && (
                    <div className={`shrink-0 flex flex-col items-center select-none mt-5 ${
                      isClear ? 'animate-avatar-float animate-avatar-glow' : ''
                    }`}>
                      <div className={`relative w-16 sm:w-24 md:w-28 h-24 sm:h-36 md:h-40 rounded-2xl overflow-hidden border-2 ${
                        isCockpit ? 'border-amber-400 bg-amber-950' : 'border-red-500 bg-red-950'
                      } shadow-md transition-all duration-300 ${isClear ? 'group-hover:scale-105' : 'filter brightness-90'}`}>
                        {isClear ? (
                          <video
                            src={isCockpit ? "/assets/aistudio/captain_1b8679c5.mp4" : "/assets/aistudio/headsetman_fcdb9adc.mp4"}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <img
                            src={isCockpit ? "/assets/aistudio/image_a010d445.png" : "/assets/aistudio/image_d903d17a.png"}
                            alt={isCockpit ? "Captain thumbnail" : "Headset Man thumbnail"}
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {/* Speaking indicator */}
                        <div className="absolute top-1.5 left-1.5 flex items-center justify-center">
                          {isClear ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping absolute" />
                              <span className="w-2.5 h-2.5 rounded-full bg-red-600 relative border border-white" />
                            </>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-400 relative border border-white/60" />
                          )}
                        </div>
                        {/* Role tag overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-900/60 to-transparent p-1.5 text-center">
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-white uppercase tracking-wider block">
                            {isCockpit ? 'AI CAPTAIN' : 'AI HEADSET MAN'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* AI Thinking Indicator with Dynamic Role Video Avatar */}
        {isAiThinking && (
          <div className="flex items-start gap-3 justify-start animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-slate-600 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-semibold text-slate-800">
                {userRole === 'Ground' ? 'Captain đang truyền khẩu lệnh vô tuyến...' : 'Headset Man đang truyền khẩu lệnh...'}
              </span>
            </div>
            <div className="relative w-14 sm:w-20 h-20 sm:h-28 rounded-2xl overflow-hidden border-2 border-red-500 bg-slate-900 shadow-xs shrink-0 animate-avatar-float animate-avatar-glow">
              <video
                src={userRole === 'Ground' ? '/assets/aistudio/captain_1b8679c5.mp4' : '/assets/aistudio/headsetman_fcdb9adc.mp4'}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        )}

        {/* Evaluating Indicator with Student Video Avatar */}
        {isEvaluating && (
          <div className="flex items-start gap-3 justify-end ml-auto animate-fadeIn">
            <div className="relative w-14 sm:w-20 h-20 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400 bg-slate-900 shadow-xs shrink-0 animate-avatar-float animate-avatar-user-glow">
              <video
                src={userRole === 'Ground' ? '/assets/aistudio/headsetman_fcdb9adc.mp4' : '/assets/aistudio/captain_1b8679c5.mp4'}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-800 p-3 bg-amber-50 rounded-2xl border border-amber-300 shadow-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span className="font-semibold">AI đang phân tích và chấm điểm phát âm...</span>
            </div>
          </div>
        )}

        {showScrollBottomBtn && (
          <div className="sticky bottom-2 flex justify-center z-30 pointer-events-none">
            <button
              type="button"
              onClick={scrollToBottom}
              className="pointer-events-auto px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer animate-bounce"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Cuộn xuống tin mới nhất</span>
            </button>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      {/* Lời thoại nhắc nhở Support Prompt Banner */}
      {currentExpectedText && practiceMode !== 'exam' && (
        <div className="shrink-0 p-3 bg-white border-t border-slate-200 shadow-md">
          <div className="max-w-4xl mx-auto flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                  <span>Lời thoại nhắc nhở chuẩn ICAO</span>
                  {currentExpectedSpeaker && (
                    <span className="text-slate-500 font-semibold">
                      (Dành cho vai: {currentExpectedSpeaker === 'Ground' ? 'Headset Man' : 'Phi công'})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={onToggleKaraoke}
                  className="text-slate-500 hover:text-red-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title={karaokeEnabled ? 'Ẩn lời thoại nhắc nhở để thử thách phản xạ' : 'Hiện lời thoại nhắc nhở'}
                >
                  {karaokeEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{karaokeEnabled ? 'Ẩn Lời thoại' : 'Hiện Lời thoại'}</span>
                </button>
              </div>

              {karaokeEnabled ? (
                <div>
                  <p className={`text-sm sm:text-base font-bold font-mono text-slate-900 tracking-wide ${pendingRetryTurn ? 'text-red-700' : ''}`}>
                    "{currentExpectedText}"
                  </p>
                  {currentExpectedVietnamese && (
                    <p className="text-xs text-slate-600 italic mt-0.5">
                      Nghĩa: {currentExpectedVietnamese}
                    </p>
                  )}
                  {currentExpectedPronunciation && (
                    <p className="text-[11px] text-amber-700 font-mono mt-0.5 font-medium">
                      Phát âm: {currentExpectedPronunciation}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  [Chế độ phản xạ không gợi ý - Hãy nhớ khẩu lệnh và phát âm qua micro]
                </p>
              )}
            </div>

            {onSelectPracticeSentence && (
              <button
                type="button"
                onClick={() => onSelectPracticeSentence(currentExpectedText)}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-300 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                Nhập câu này
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exam Mode Context Banner */}
      {practiceMode === 'exam' && (
        <div className="shrink-0 p-2.5 bg-gradient-to-r from-red-50 to-amber-50 border-t border-red-200 text-xs text-red-900 font-semibold flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-red-600" />
            <span>BÀI KIỂM TRA QUÁ TRÌNH THANG ĐIỂM 100: Phản hồi tự do bám sát tình huống, không có gợi ý.</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-600">Mức Đạt: &ge; 80%</span>
        </div>
      )}
    </div>
  );
};
