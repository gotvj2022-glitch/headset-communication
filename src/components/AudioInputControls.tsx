import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, AlertCircle, Globe, Sparkles, Eye, EyeOff } from 'lucide-react';
import { playRadioClick } from '../utils/audioPlayer';

interface AudioInputControlsProps {
  onTransmit: (text: string, audioBase64?: string, mimeType?: string) => void;
  disabled: boolean;
  expectedText?: string | null;
  userRole: 'Ground' | 'Cockpit';
  presetText?: string;
  pendingRetryTurn?: boolean;
}

export const AudioInputControls: React.FC<AudioInputControlsProps> = ({
  onTransmit,
  disabled,
  expectedText,
  userRole,
  presetText = '',
  pendingRetryTurn = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState<'en-US' | 'vi-VN'>('en-US');
  const [previewEnabled, setPreviewEnabled] = useState<boolean>(false);
  const [livePreviewText, setLivePreviewText] = useState<string>('');
  const [audioWarning, setAudioWarning] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<any>(null);
  const recordedMimeTypeRef = useRef<string>('audio/webm;codecs=opus');

  useEffect(() => {
    if (presetText) {
      setTextInput(presetText);
    }
  }, [presetText]);

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
      setLivePreviewText('');
      setRecordSeconds(0);
      isRecordingRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setHasMicPermission(true);

      // Audio visualizer setup
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

      // Detect best supported audio mime type with priority on audio/webm;codecs=opus
      let chosenMime = 'audio/webm;codecs=opus';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          chosenMime = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          chosenMime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          chosenMime = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          chosenMime = 'audio/ogg';
        }
      }
      recordedMimeTypeRef.current = chosenMime;

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      // ONLY start Web Speech API if Preview is toggled ON (default is OFF)
      // Note: Live preview text is strictly on-screen only and is NEVER sent to the server.
      if (previewEnabled) {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = speechLanguage;
            recognition.maxAlternatives = 1;

            recognition.onresult = (event: any) => {
              let textAccumulator = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                const res = event.results[i];
                const chunk = res[0]?.transcript || '';
                textAccumulator += chunk;
              }
              if (textAccumulator.trim()) {
                setLivePreviewText(textAccumulator.trim());
              }
            };

            recognition.onerror = (event: any) => {
              console.warn('Speech recognition preview status:', event.error);
            };

            recognition.onend = () => {
              if (isRecordingRef.current && previewEnabled) {
                try {
                  recognition.start();
                } catch {
                  // Ignore
                }
              }
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (recognitionInitErr) {
            console.warn('SpeechRecognition initialization error:', recognitionInitErr);
          }
        }
      }
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setHasMicPermission(false);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecordingAndTransmit = async () => {
    isRecordingRef.current = false;
    playRadioClick('close');
    setIsRecording(false);
    setIsPackaging(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close().catch(() => {});

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: recordedMimeTypeRef.current || 'audio/webm;codecs=opus',
          });

          // Check if audio blob is smaller than 2 KB (2048 bytes)
          if (audioBlob.size < 2048) {
            setIsPackaging(false);
            setAudioWarning('Không thu được âm thanh, vui lòng nói lại');
            setLivePreviewText('');
            return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string) || '';
            setIsPackaging(false);
            setLivePreviewText('');
            // Call onTransmit('', base64Audio, mimeType) - send audio only, no browser transcript
            onTransmit('', base64Audio, recordedMimeTypeRef.current || 'audio/webm;codecs=opus');
            setTextInput('');
          };
          reader.readAsDataURL(audioBlob);
        } catch (packErr) {
          console.warn('Audio packaging error:', packErr);
          setIsPackaging(false);
          setAudioWarning('Không thu được âm thanh, vui lòng nói lại');
        } finally {
          recorder.stream.getTracks().forEach((track) => track.stop());
        }
      };
      recorder.stop();
    } else {
      setIsPackaging(false);
      setAudioWarning('Không thu được âm thanh, vui lòng nói lại');
    }
  };

  const stopRecordingCleanup = () => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setIsPackaging(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
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
    setLivePreviewText('');
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

        {/* On-screen only preview text when Preview toggle is ON */}
        {previewEnabled && isRecording && livePreviewText && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-700 animate-fadeIn">
            <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-slate-500 font-semibold">Preview màn hình:</span>
            <span className="font-mono text-slate-800 italic truncate">"{livePreviewText}"</span>
            <span className="text-[10px] text-slate-400 ml-auto shrink-0">(chỉ hiển thị xem trước, không gửi lên server)</span>
          </div>
        )}

        {/* Action Controls: Toggle Mic + Text Input + Language Switch + Preview Toggle */}
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

          {/* Small Preview Toggle (Default OFF, displays live text on-screen only, never sent to server) */}
          <button
            type="button"
            onClick={() => setPreviewEnabled((prev) => !prev)}
            disabled={isRecording || disabled}
            title={`Xem trước giọng nói trên màn hình: ${previewEnabled ? 'Đang BẬT' : 'Đang TẮT'} (chỉ xem trên màn hình, không gửi văn bản lên server)`}
            className={`flex items-center gap-1.5 px-2.5 py-2.5 sm:py-3 rounded-xl border text-xs font-semibold transition-colors shrink-0 shadow-2xs cursor-pointer ${
              previewEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {previewEnabled ? (
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className="font-mono text-[11px] font-bold">
              Preview: {previewEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Language selector toggle (EN for Aviation standard, VI for Vietnamese context) */}
          <button
            type="button"
            onClick={() => setSpeechLanguage((lang) => (lang === 'en-US' ? 'vi-VN' : 'en-US'))}
            disabled={isRecording || disabled}
            title={`Ngôn ngữ nhận diện giọng nói preview: ${speechLanguage === 'en-US' ? 'Tiếng Anh Hàng không (en-US)' : 'Tiếng Việt (vi-VN)'}`}
            className="flex items-center gap-1 px-2.5 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shrink-0 shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono font-bold text-[11px] text-red-600">
              {speechLanguage === 'en-US' ? 'EN' : 'VI'}
            </span>
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
                  ? 'Đang thu âm luồng âm thanh Opus...'
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
