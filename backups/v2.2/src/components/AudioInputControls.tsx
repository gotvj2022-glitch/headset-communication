import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, AlertCircle, Sparkles } from 'lucide-react';
import { playRadioClick } from '../utils/audioPlayer';

interface AudioInputControlsProps {
  onTransmit: (text: string, audioBase64?: string, mimeType?: string) => void;
  disabled: boolean;
  expectedText?: string | null;
  userRole: 'Ground' | 'Cockpit';
  presetText?: string;
  pendingRetryTurn?: boolean;
  lastTranscribedText?: string;
  isEvaluating?: boolean;
}

export const AudioInputControls: React.FC<AudioInputControlsProps> = ({
  onTransmit,
  disabled,
  expectedText,
  userRole,
  presetText = '',
  pendingRetryTurn = false,
  lastTranscribedText = '',
  isEvaluating = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [audioWarning, setAudioWarning] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<any>(null);

  useEffect(() => {
    if (presetText) {
      setTextInput(presetText);
    }
  }, [presetText]);

  useEffect(() => {
    if (lastTranscribedText) {
      setTextInput(lastTranscribedText);
    }
  }, [lastTranscribedText]);

  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      setAudioWarning(null);
      playRadioClick('open');
      audioChunksRef.current = [];
      setRecordSeconds(0);
      isRecordingRef.current = true;

      // 2. Start recording exactly per VIAA-GOT spec: no extra constraints
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);

      // Audio visualizer setup (AnalyserNode only reads the stream)
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const updateLevel = () => {
            if (!analyserRef.current || !isRecordingRef.current) return;
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) sum += data[i];
            const avg = sum / data.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualization setup error:', audioCtxErr);
      }

      let mime = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) mime = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mime = 'audio/ogg';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mime = 'audio/mp4';

      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.start(250); // 250 ms time slice
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setHasMicPermission(false);
      setIsRecording(false);
      isRecordingRef.current = false;
      setAudioWarning('Microphone access denied. Please grant microphone permission in your browser.');
    }
  };

  const stopRecordingAndTransmit = async () => {
    isRecordingRef.current = false;
    playRadioClick('close');
    setIsRecording(false);
    setIsPackaging(true);

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        try {
          recorder.stream.getTracks().forEach((t) => t.stop());

          const chunks = audioChunksRef.current;
          if (chunks.length === 0) {
            setIsPackaging(false);
            setAudioWarning('No speech data captured. Please speak closer to your microphone.');
            return;
          }

          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          if (blob.size < 100) {
            setIsPackaging(false);
            setAudioWarning('No speech data captured. Please speak closer to your microphone.');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const resultStr = (reader.result as string) || '';
            const base64 = resultStr.split(',')[1] || '';
            setIsPackaging(false);
            // Transmit audio without browser transcript
            onTransmit('', base64, recorder.mimeType || 'audio/webm');
          };
          reader.readAsDataURL(blob);
        } catch (packErr) {
          console.warn('Audio packaging error:', packErr);
          setIsPackaging(false);
          setAudioWarning('No speech data captured. Please speak closer to your microphone.');
        }
      };
      recorder.stop();
    } else {
      setIsPackaging(false);
      setAudioWarning('No speech data captured. Please speak closer to your microphone.');
    }
  };

  const stopRecordingCleanup = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsPackaging(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
  };

  const handleManualSend = () => {
    if (!textInput.trim() || disabled) return;
    playRadioClick('close');
    onTransmit(textInput.trim());
    setTextInput('');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4 shadow-sm">
      <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
        {/* Permission warning */}
        {hasMicPermission === false && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Microphone chưa được cấp quyền trong trình duyệt. Bạn có thể gõ nội dung hoặc nhấn vào câu gợi ý bên trên để gửi nhanh.
            </span>
          </div>
        )}

        {/* Audio Size / Recording Warning */}
        {audioWarning && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-100 border border-red-300 text-xs text-red-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{audioWarning}</span>
          </div>
        )}

        {/* Real-time Processing Indicator */}
        {isEvaluating && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 shadow-2xs animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <span className="font-semibold">VIAA-GOT: Đang xử lý âm thanh & đánh giá khẩu lệnh...</span>
          </div>
        )}

        {/* Live Audio Visualizer Waves and Status while recording */}
        {isRecording && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-300 shadow-xs">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <div className="flex items-center gap-1.5 font-mono text-xs text-red-700 font-bold">
                <Radio className="w-4 h-4" />
                <span>ĐANG THU ÂM KHẨU LỆNH</span>
              </div>
              <span className="font-mono text-xs text-slate-900 font-black bg-white px-2 py-0.5 rounded border border-red-200">
                {formatTimer(recordSeconds)}
              </span>
            </div>

            {/* Dynamic visualizer wave bars */}
            <div className="flex items-center gap-1 h-5 px-2">
              {[30, 60, 95, 55, 100, 45, 85, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-600 rounded-full transition-all duration-75"
                  style={{
                    height: `${Math.max(4, Math.round((h * Math.max(audioLevel, 15)) / 100))}px`,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-semibold hidden md:inline">
                Nói xong bấm lại nút đỏ để gửi
              </span>
            </div>
          </div>
        )}

        {/* Action Controls: Toggle Mic + Text Input */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Main Push-To-Toggle Recording Button */}
          <button
            type="button"
            onClick={() => {
              if (isPackaging) return;
              if (isRecording) {
                stopRecordingAndTransmit();
              } else {
                startRecording();
              }
            }}
            disabled={disabled || isPackaging}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all shadow-xs shrink-0 cursor-pointer ${
              isPackaging
                ? 'bg-amber-600 text-white cursor-wait opacity-90'
                : isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-400/20'
                : pendingRetryTurn
                ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-400/20 animate-pulse'
                : disabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/20 active:scale-95'
            }`}
          >
            {isPackaging ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                <span>Đang gửi âm thanh...</span>
              </>
            ) : isRecording ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Dừng & Gửi ({formatTimer(recordSeconds)})</span>
              </>
            ) : pendingRetryTurn ? (
              <>
                <Mic className="w-4 h-4" />
                <span>Bấm Thu Lại Câu Này</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Bấm để Bắt Đầu Nói</span>
              </>
            )}
          </button>

          {/* Text input fallback / edit bar */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleManualSend();
                }
              }}
              disabled={disabled || isRecording}
              placeholder={
                isRecording
                  ? 'Đang thu âm luồng âm thanh...'
                  : `Nhập khẩu lệnh ICAO (${userRole === 'Ground' ? 'Ground' : 'Cockpit'})...`
              }
              className="w-full bg-slate-50 border border-slate-300 focus:border-red-500 focus:bg-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-mono focus:outline-none pr-10 transition-colors shadow-2xs"
            />
            <button
              type="button"
              onClick={handleManualSend}
              disabled={disabled || isRecording || !textInput.trim()}
              className={`absolute right-2 p-1.5 rounded-lg transition-colors ${
                textInput.trim() && !disabled && !isRecording
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-xs cursor-pointer'
                  : 'text-slate-400 cursor-not-allowed'
              }`}
              title="Gửi khẩu lệnh"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
