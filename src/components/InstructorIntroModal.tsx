import React, { useState, useRef, useEffect } from 'react';
import { SCENARIOS, Scenario } from '../data/scenarios';
import { UserRole, PracticeMode, StudentLevel } from '../types';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Plane,
  Wrench,
  CheckCircle2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Award,
  ChevronRight,
  Headphones,
  Check,
  Radio,
  FileCheck2,
  Target
} from 'lucide-react';

interface InstructorIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTraining: (config: {
    scenario: Scenario;
    practiceMode: PracticeMode;
    studentLevel: StudentLevel;
    userRole: UserRole;
  }) => void;
  currentScenario: Scenario;
  currentPracticeMode: PracticeMode;
  currentStudentLevel: StudentLevel;
  currentUserRole: UserRole;
}

export const InstructorIntroModal: React.FC<InstructorIntroModalProps> = ({
  isOpen,
  onClose,
  onStartTraining,
  currentScenario,
  currentPracticeMode,
  currentStudentLevel,
  currentUserRole,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(currentScenario.id);
  const [selectedMode, setSelectedMode] = useState<PracticeMode>(currentPracticeMode);
  const [selectedLevel, setSelectedLevel] = useState<StudentLevel>(currentStudentLevel);
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUserRole);

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync internal state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedScenarioId(currentScenario.id);
      setSelectedMode(currentPracticeMode);
      setSelectedLevel(currentStudentLevel);
      setSelectedRole(currentUserRole);

      // Attempt autoplay audio and video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlayingAudio(true))
            .catch((err) => {
              console.log('[InstructorIntro] Autoplay prevented by browser:', err);
              setIsPlayingAudio(false);
            });
        }
      }
    } else {
      // Pause audio and video when modal is closed
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, currentScenario.id, currentPracticeMode, currentStudentLevel, currentUserRole]);

  // Audio and video event listeners (stops playing clip after ~9s when speaking completes)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioProgress(audio.currentTime);
      // Stop video and audio after ~9s when instructor greeting completes
      if (audio.currentTime >= 9.2 && !audio.paused) {
        audio.pause();
        setIsPlayingAudio(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    };
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration || 0);
    };
    const handleEnded = () => {
      setIsPlayingAudio(false);
      setAudioProgress(audio.duration || 0);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      if (videoRef.current) videoRef.current.pause();
    } else {
      if (videoRef.current) {
        if (audioRef.current.currentTime >= 9.0) {
          videoRef.current.currentTime = 0;
          audioRef.current.currentTime = 0;
        }
        videoRef.current.play().catch(() => {});
      }
      audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
    }
  };

  const replayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
    audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(() => {});
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isAudioMuted;
    setIsAudioMuted(!isAudioMuted);
  };

  const handleConfirmStart = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const targetScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || currentScenario;
    onStartTraining({
      scenario: targetScenario,
      practiceMode: selectedMode,
      studentLevel: selectedLevel,
      userRole: selectedRole,
    });
    onClose();
  };

  if (!isOpen) return null;

  const chosenScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      {/* Hidden audio element playing the WAV file */}
      <audio
        ref={audioRef}
        src="/assets/aistudio/Generated_Audio_November_02__2026_-_2_52PM_d5fb7c4f.wav"
        preload="auto"
      />

      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden text-slate-800">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 px-6 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <GraduationCap className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white font-bold">
                  HỌC VIỆN HÀNG KHÔNG VICTORIA (VIAA)
                </span>
                <span className="text-[10px] text-amber-200 font-mono">VJC-GOP-M-01</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center gap-2">
                GIỚI THIỆU KHÓA HỌC & THIẾT LẬP HUẤN LUYỆN
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors text-xs font-semibold cursor-pointer"
              title="Đóng cửa sổ"
            >
              Bỏ qua
            </button>
          </div>
        </div>

        {/* Modal Body: Split Layout (Instructor Video & Audio on Left, Menu Options on Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* LEFT COLUMN: Instructor Video & Voice Player (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-gradient-to-b from-slate-50 via-white to-red-50/30 flex flex-col justify-between">
            <div>
              {/* Instructor Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                  <span className="text-xs font-black uppercase text-red-700 tracking-wider">
                    Giáo Viên Hướng Dẫn (Instructor)
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                  AI Tutor 24/7
                </span>
              </div>

              {/* Video Player Box with Balanced Sizing */}
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden border-2 border-red-500/80 bg-slate-900 shadow-lg group">
                <video
                  ref={videoRef}
                  src="/assets/aistudio/instructor_aef09d80.mp4"
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />

                {/* Overlay live speaking tag */}
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white flex items-center gap-1.5">
                  <Volume2 className={`w-3.5 h-3.5 text-amber-400 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                  <span className="text-[10px] font-mono font-bold">
                    {isPlayingAudio ? 'ĐANG PHÁT LỜI CHÀO...' : 'TẠM DỪNG'}
                  </span>
                </div>

                {/* Visual sound waves if playing */}
                {isPlayingAudio && (
                  <div className="absolute bottom-2.5 right-2.5 flex items-end gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-xs">
                    <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" />
                    <span className="w-1 h-5 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:450ms]" />
                  </div>
                )}
              </div>

              {/* Audio Controls Bar */}
              <div className="mt-3 p-3 bg-white rounded-2xl border border-red-100 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer"
                      title={isPlayingAudio ? 'Tạm dừng giọng đọc' : 'Phát giọng đọc'}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={replayAudio}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                      title="Nghe lại từ đầu"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
                      title={isAudioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                    >
                      {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {Math.floor(audioProgress)}s / {audioDuration ? Math.floor(audioDuration) : 10}s
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-red-600 h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${audioDuration > 0 ? (audioProgress / audioDuration) * 100 : isPlayingAudio ? 50 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Greeting Transcript Box */}
              <div className="mt-3 p-3 bg-red-50/60 rounded-2xl border border-red-200/70 text-xs text-slate-700 leading-relaxed">
                <p className="font-bold text-red-950 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  Lời chào từ Giáo viên VIAA:
                </p>
                <p className="italic text-slate-600">
                  &ldquo;Chào mừng bạn đến với hệ thống trợ giảng thực hành liên lạc vô tuyến Headset Communication. Bạn hãy chọn chế độ, cấp độ và kịch bản bên phải để bước vào buồng huấn luyện.&rdquo;
                </p>
              </div>
            </div>

            {/* Regulatory Reference Info */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Chuẩn đào tạo: <b>VJC-VJAA-M-125</b></span>
              <span className="font-mono text-red-600 font-bold">VIAA-GOT 2026</span>
            </div>
          </div>

          {/* RIGHT COLUMN: 4 Option Groups (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col gap-5 bg-white">
            
            {/* 1. CHẾ ĐỘ HUẤN LUYỆN */}
            <div>
              <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                  1
                </span>
                Chế độ huấn luyện
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Kịch bản chuẩn */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('scenario')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex items-center justify-center ${
                    selectedMode === 'scenario'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  {selectedMode === 'scenario' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <CheckCircle2 className="w-4 h-4 fill-red-100" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Kịch bản chuẩn</span>
                </button>

                {/* Đối thoại tự do */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('free')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex items-center justify-center ${
                    selectedMode === 'free'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  {selectedMode === 'free' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <CheckCircle2 className="w-4 h-4 fill-red-100" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Đối thoại tự do</span>
                </button>

                {/* Kiểm tra quá trình */}
                <button
                  type="button"
                  onClick={() => setSelectedMode('exam')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative flex items-center justify-center ${
                    selectedMode === 'exam'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  {selectedMode === 'exam' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <CheckCircle2 className="w-4 h-4 fill-red-100" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Kiểm tra quá trình</span>
                </button>
              </div>
            </div>

            {/* 2. CẤP ĐỘ ĐÁNH GIÁ */}
            <div>
              <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                  2
                </span>
                Cấp độ đánh giá
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Level 1: Beginner */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('beginner')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center relative ${
                    selectedLevel === 'beginner'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedLevel === 'beginner' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Mức 1: Cơ bản (&gt;30%)</span>
                </button>

                {/* Level 2: Intermediate */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('intermediate')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center relative ${
                    selectedLevel === 'intermediate'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedLevel === 'intermediate' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Mức 2: Tiêu chuẩn (&gt;50%)</span>
                </button>

                {/* Level 3: Advanced */}
                <button
                  type="button"
                  onClick={() => setSelectedLevel('advanced')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex items-center justify-center relative ${
                    selectedLevel === 'advanced'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {selectedLevel === 'advanced' && (
                    <div className="absolute top-2 right-2 text-red-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <span className="font-bold text-xs text-slate-900">Mức 3: Đầu ra (&gt;70%)</span>
                </button>
              </div>
            </div>

            {/* 3. TÌNH HUỐNG BÀI HỌC */}
            <div>
              <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                  3
                </span>
                Tình huống bài học
              </label>

              {/* Scenario Selector Dropdown */}
              <div className="relative">
                <select
                  value={selectedScenarioId}
                  onChange={(e) => setSelectedScenarioId(e.target.value)}
                  className="w-full p-3 pr-10 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer appearance-none transition-colors"
                >
                  {SCENARIOS.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      Bài {idx + 1}: {s.title} ({s.aircraft})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* 4. VAI TRÒ THỰC HÀNH */}
            <div>
              <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5 mb-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                  4
                </span>
                Vai trò thực hành
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* Headset Man */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('Ground')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedRole === 'Ground'
                      ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      Headset Man (Thợ máy)
                    </span>
                  </div>
                  {selectedRole === 'Ground' && (
                    <CheckCircle2 className="w-4 h-4 text-red-600 fill-red-100 shrink-0" />
                  )}
                </button>

                {/* Cockpit */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('Cockpit')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    selectedRole === 'Cockpit'
                      ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/30 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      Phi công (Cockpit)
                    </span>
                  </div>
                  {selectedRole === 'Cockpit' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 fill-amber-100 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* ACTION BUTTON TO ENTER TRAINING */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmStart}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-black text-sm tracking-wide shadow-lg shadow-red-500/25 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <span>VÀO BUỒNG HUẤN LUYỆN (Bắt Đầu Ngay)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-mono">
                Hệ thống tự động kích hoạt buồng đàm thoại với kịch bản & cấu hình đã chọn
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
