import React from 'react';
import { Scenario } from '../data/scenarios';
import { ChatMessage, UserRole, PracticeMode, StudentLevel, getPassingThreshold } from '../types';
import { Trophy, CheckCircle, AlertTriangle, X, RotateCcw, Save, Award, GraduationCap } from 'lucide-react';

interface EvaluationSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: Scenario;
  userRole: UserRole;
  practiceMode: PracticeMode;
  studentLevel: StudentLevel;
  messages: ChatMessage[];
  onRestart: () => void;
  onSaveToHistory: () => void;
}

export const EvaluationSummaryModal: React.FC<EvaluationSummaryModalProps> = ({
  isOpen,
  onClose,
  scenario,
  userRole,
  practiceMode,
  studentLevel,
  messages,
  onRestart,
  onSaveToHistory
}) => {
  if (!isOpen) return null;

  // Calculate scores from user messages
  const userMessagesWithEval = messages.filter((m) => m.isUser && m.evaluation);
  const totalUserTurns = userMessagesWithEval.length;

  let averageScore = 85;
  let averagePronunciation = 82;
  let averagePhraseology = 88;

  if (totalUserTurns > 0) {
    const sumTotal = userMessagesWithEval.reduce((acc, m) => acc + (m.evaluation?.overallScore || 0), 0);
    const sumPron = userMessagesWithEval.reduce((acc, m) => acc + (m.evaluation?.pronunciationScore || 0), 0);
    const sumPhrase = userMessagesWithEval.reduce((acc, m) => acc + (m.evaluation?.phraseologyScore || 0), 0);
    averageScore = Math.round(sumTotal / totalUserTurns);
    averagePronunciation = Math.round(sumPron / totalUserTurns);
    averagePhraseology = Math.round(sumPhrase / totalUserTurns);
  }

  const allMispronounced = userMessagesWithEval.flatMap((m) => m.evaluation?.mispronouncedWords || []);

  // Level-specific evaluation (>30%, >50%, >70%)
  const threshold = getPassingThreshold(studentLevel);
  const isPassed = averageScore > threshold;
  const isGood = averageScore >= (threshold + 25);
  const isFailed = !isPassed;

  const rubricLevel = isGood
    ? `Mức Tốt (>${threshold + 25}%)`
    : isPassed
    ? `Mức Đạt (>${threshold}%)`
    : `Chưa Đạt (≤${threshold}%)`;

  const rubricBadgeColor = isGood
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isPassed
    ? 'bg-sky-100 text-sky-800 border-sky-300'
    : 'bg-red-100 text-red-800 border-red-300';

  const isExam = practiceMode === 'exam';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-xl p-5 sm:p-6 text-slate-800">
        {/* Header with VIAA Logo */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_7fdc763d.png"
              alt="Victoria Aviation Academy"
              className="h-11 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {isExam ? 'BẢNG ĐIỂM KIỂM TRA QUÁ TRÌNH' : 'KẾT QUẢ ĐÁNH GIÁ ĐÀM THOẠI'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                  {isExam ? 'THANG ĐIỂM 100' : 'LUYỆN TẬP'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Học viện Hàng không Victoria (VIAA) · {scenario.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student metadata box */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-4">
          <div>
            <span className="text-slate-500 block text-[11px]">Vai trò:</span>
            <span className="font-bold text-slate-900">{userRole === 'Ground' ? 'Headset Man' : 'Phi công (Cockpit)'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Cấp độ học viên:</span>
            <span className="font-bold text-slate-900 uppercase">
              {studentLevel === 'beginner'
                ? 'Mức 1: Cơ bản (> 30% đạt)'
                : studentLevel === 'intermediate'
                ? 'Mức 2: Tiêu chuẩn (> 50% đạt)'
                : 'Mức 3: Đạt chuẩn đầu ra (> 70% đạt)'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Trạng thái môn học:</span>
            <span className={`font-black ${isFailed ? 'text-red-600' : 'text-emerald-700'}`}>
              {isFailed ? 'CẦN THI LẠI' : 'ĐỦ ĐIỀU KIỆN'}
            </span>
          </div>
        </div>

        {/* Big Score Hero Banner */}
        <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-xl p-5 text-center mb-5 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng Điểm Đánh Giá Cuối Bài
          </span>
          <div className="flex items-baseline justify-center gap-1 my-2">
            <span className="text-5xl font-black font-mono text-slate-900 tracking-tight">{averageScore}</span>
            <span className="text-xl text-slate-400 font-mono">/100</span>
          </div>
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black font-mono border ${rubricBadgeColor}`}>
            <span>XẾP LOẠI: {rubricLevel}</span>
          </div>

          {/* Sub metrics */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-200 text-left">
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Phát âm & Ngữ điệu</span>
              <span className="text-xl font-black font-mono text-red-600">{averagePronunciation}%</span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Thuật ngữ chuẩn ICAO</span>
              <span className="text-xl font-black font-mono text-amber-600">{averagePhraseology}%</span>
            </div>
          </div>
        </div>

        {/* Mispronounced Words Breakdown */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Phân tích từ vựng & khẩu lệnh ({allMispronounced.length} điểm cần cải thiện)</span>
          </h3>

          {allMispronounced.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Tuyệt vời! Toàn bộ các lượt đàm thoại đều được phát âm chuẩn xác theo quy tắc ICAO.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {allMispronounced.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red-600 text-sm">
                        "{item.word}"
                      </span>
                      {item.correctIcao && (
                        <span className="text-[11px] text-sky-700 font-mono font-semibold">
                          (Chuẩn ICAO: {item.correctIcao})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{item.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              onSaveToHistory();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1.5 border border-slate-300"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Vào Hồ Sơ</span>
          </button>
          <button
            onClick={() => {
              onRestart();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isExam ? 'Làm Lại Bài Kiểm Tra' : 'Luyện Tập Lại'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
