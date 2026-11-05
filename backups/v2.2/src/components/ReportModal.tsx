import React, { useRef, useState } from 'react';
import { Scenario } from '../data/scenarios';
import { ChatMessage, PracticeMode, StudentLevel, UserRole, getPassingThreshold } from '../types';
import { FileText, Printer, X, CheckCircle2, AlertTriangle, Award, Plane, Wrench, GraduationCap, Calendar, User, Check, ShieldCheck, Download } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedScenario: Scenario;
  practiceMode: PracticeMode;
  studentLevel: StudentLevel;
  userRole: UserRole;
  messages: ChatMessage[];
  currentUser?: { username?: string; name?: string; email?: string; role?: string } | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  selectedScenario,
  practiceMode,
  studentLevel,
  userRole,
  messages,
  currentUser,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [showPdfTip, setShowPdfTip] = useState(false);

  if (!isOpen) return null;

  const passingThreshold = getPassingThreshold(studentLevel);

  // Compute statistics from messages
  const evaluatedMessages = messages.filter((m) => m.evaluation);
  const totalTurns = evaluatedMessages.length;
  
  const avgOverall = totalTurns > 0
    ? Math.round(evaluatedMessages.reduce((acc, m) => acc + (m.evaluation?.overallScore || 0), 0) / totalTurns)
    : 0;

  const avgPronunciation = totalTurns > 0
    ? Math.round(evaluatedMessages.reduce((acc, m) => acc + (m.evaluation?.pronunciationScore || 0), 0) / totalTurns)
    : 0;

  const avgPhraseology = totalTurns > 0
    ? Math.round(evaluatedMessages.reduce((acc, m) => acc + (m.evaluation?.phraseologyScore || 0), 0) / totalTurns)
    : 0;

  const avgGrammar = totalTurns > 0
    ? Math.round(evaluatedMessages.reduce((acc, m) => acc + (m.evaluation?.grammarScore || avgOverall), 0) / totalTurns)
    : 0;

  const avgVocabulary = totalTurns > 0
    ? Math.round(evaluatedMessages.reduce((acc, m) => acc + (m.evaluation?.vocabularyScore || avgOverall), 0) / totalTurns)
    : 0;

  const passedCount = evaluatedMessages.filter((m) => m.evaluation?.isPassed).length;
  const successRate = totalTurns > 0 ? Math.round((passedCount / totalTurns) * 100) : 0;
  const isOverallPassed = avgOverall >= passingThreshold;

  const getModeLabel = () => {
    switch (practiceMode) {
      case 'scenario': return 'Kịch bản chuẩn (10 cặp câu)';
      case 'free': return 'Đối thoại tự do (Free Practice)';
      case 'exam': return 'Kiểm tra quá trình (Exam Mode)';
    }
  };

  const getLevelLabel = () => {
    switch (studentLevel) {
      case 'beginner': return 'Mức 1: Cơ bản (>30% đạt)';
      case 'intermediate': return 'Mức 2: Tiêu chuẩn huấn luyện (>50% đạt)';
      case 'advanced': return 'Mức 3: Đạt chuẩn đầu ra (>70% đạt)';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    setShowPdfTip(true);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      {/* Backdrop dismissal (hidden when printing) */}
      <div className="absolute inset-0 print:hidden" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-10 print:shadow-none print:border-none print:max-h-none print:w-full">
        
        {/* Modal Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Báo Cáo Kết Quả Huấn Luyện Đàm Thoại</h2>
              <p className="text-xs text-red-100">Victoria Aviation Academy (VIAA) · Khẩu lệnh & Đàm thoại mặt đất</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="px-4 py-2 bg-white text-red-900 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Xuất file PDF"
            >
              <Download className="w-4 h-4" />
              <span>Xuất PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="In ấn trực tiếp"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-red-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body (Printable area) */}
        <div ref={reportRef} className="p-6 sm:p-8 space-y-6 overflow-y-auto bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          
          {showPdfTip && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between print:hidden">
              <span>💡 <strong>Mẹo lưu PDF:</strong> Trong hộp thoại In vừa mở, hãy chọn mục <strong>Destination / Máy in</strong> thành <strong>Save as PDF</strong> (Lưu dưới dạng PDF) rồi bấm Lưu!</span>
              <button onClick={() => setShowPdfTip(false)} className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-sm cursor-pointer">×</button>
            </div>
          )}
          
          {/* Document Header (Always visible & prominent on print) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:border-none print:p-0 print:shadow-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Victoria Aviation Academy — Official Training Report</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  BÁO CÁO PHIÊN ĐÀM THOẠI HÀNG KHÔNG
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mã tình huống: <span className="font-mono font-bold text-slate-700">{selectedScenario.id}</span> · Kênh tần số đàm thoại chuẩn ICAO
                </p>
              </div>

              <div className="text-right sm:text-right text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80 print:bg-transparent print:p-0 print:border-none">
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ngày xuất: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:justify-end">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Học viên: <strong className="text-slate-900">{currentUser?.username || currentUser?.name || 'Học viên VIAA'}</strong></span>
                </div>
              </div>
            </div>

            {/* Scenario & Config Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-medium">Tình huống huấn luyện</span>
                <span className="font-bold text-slate-900 block truncate" title={selectedScenario.title}>{selectedScenario.title}</span>
                <span className="text-[11px] text-red-600 font-semibold">{selectedScenario.flight} · {selectedScenario.aircraft}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-medium">Chế độ & Vai trò</span>
                <span className="font-bold text-slate-900 block">{getModeLabel()}</span>
                <span className="text-[11px] text-slate-600 font-semibold">Vai trò: {userRole === 'Ground' ? 'Thợ máy (Headset Man)' : 'Phi công (Cockpit)'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-medium">Cấp độ chuẩn</span>
                <span className="font-bold text-slate-900 block">{getLevelLabel()}</span>
                <span className="text-[11px] text-slate-600 font-semibold">Ngưỡng đạt: &gt; {passingThreshold}%</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-0.5 font-medium">Kết quả sơ bộ</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isOverallPassed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ĐẠT ({avgOverall}%)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold text-xs border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5" /> CHƯA ĐẠT ({avgOverall}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dialogue Transcript Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:border print:shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-600" />
              <span>Nhật ký hội thoại & Đánh giá chi tiết các lượt đàm thoại ({messages.length} tin nhắn)</span>
            </h3>

            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 italic">Chưa có lượt đàm thoại nào trong phiên này.</p>
              ) : (
                messages.map((msg, idx) => {
                  const evalRes = msg.evaluation;
                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        msg.isUser
                          ? 'bg-slate-50/80 border-slate-200 ml-0 sm:ml-4'
                          : 'bg-red-50/40 border-red-200/80 mr-0 sm:mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            msg.sender === 'Ground' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {msg.sender === 'Ground' ? 'G' : 'C'}
                          </span>
                          <span className="font-bold text-slate-900">
                            {msg.sender === 'Ground' ? 'Thợ máy (Ground)' : 'Tổ bay (Cockpit)'}
                            {msg.isUser ? ' (Học viên)' : ' (AI Trainer)'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {evalRes && (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] ${
                              evalRes.overallScore >= passingThreshold
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              Điểm: {evalRes.overallScore}%
                            </span>
                            {evalRes.matchedStep !== undefined && (
                              <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                evalRes.matchedStep ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                Khớp bước: {evalRes.similarity || 0}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Text */}
                      <div className="text-slate-900 font-medium text-xs sm:text-sm pl-8">
                        "{msg.text}"
                      </div>

                      {msg.vietnamese && (
                        <div className="text-slate-500 italic text-[11px] pl-8">
                          Dịch nghĩa: {msg.vietnamese}
                        </div>
                      )}

                      {/* Evaluation Feedback details if present */}
                      {evalRes && (
                        <div className="mt-2 pl-8 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="font-bold text-slate-700">Đánh giá phát âm:</span> <span className="text-slate-600">{evalRes.feedbackSummary}</span>
                          </div>
                          {evalRes.mispronouncedWords && evalRes.mispronouncedWords.length > 0 && (
                            <div>
                              <span className="font-bold text-red-600">Từ cần lưu ý:</span>{' '}
                              <span className="text-slate-600">
                                {evalRes.mispronouncedWords.map((w) => `${w.word} (${w.tip})`).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary & Statistics Section at the End */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:border print:shadow-none">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-red-600" />
              <span>Thống kê tổng quan & Nhận xét cuộc đàm thoại cho tới hiện tại</span>
            </h3>

            {/* Score Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Điểm trung bình</span>
                <span className="text-2xl font-black text-red-600 font-mono">{avgOverall}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Ngưỡng: &gt; {passingThreshold}%</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Phát âm (Pronunc.)</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{avgPronunciation}%</span>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Tiêu chuẩn ICAO</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Khẩu lệnh (Phraseology)</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{avgPhraseology}%</span>
                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Độ chính xác từ ngữ</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Ngữ pháp & Từ vựng</span>
                <span className="text-2xl font-black text-slate-900 font-mono">{Math.round((avgGrammar + avgVocabulary) / 2)}%</span>
                <span className="text-[10px] text-amber-600 font-semibold block mt-0.5">Gram & Vocab</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-500 block mb-1 font-medium">Tỷ lệ hoàn thành</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{successRate}%</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{passedCount}/{totalTurns} lượt đạt</span>
              </div>
            </div>

            {/* Instructor Comments & Recommendations */}
            <div className="p-4 rounded-xl bg-red-50/60 border border-red-200 space-y-2 text-xs">
              <h4 className="font-bold text-red-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-red-600" />
                <span>Nhận xét & Đánh giá chuyên môn của Giảng viên (Instructor Feedback):</span>
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {avgOverall >= passingThreshold ? (
                  <>
                    Học viên đã hoàn thành tốt các bước đàm thoại trong tình huống <strong>{selectedScenario.title}</strong> với điểm trung bình đạt <strong>{avgOverall}%</strong> (đạt chuẩn yêu cầu của học viện VIAA). Khẩu lệnh phát âm rõ ràng, sử dụng đúng từ khóa ICAO và duy trì tốc độ phản xạ tốt trên tần số vô tuyến. Tiếp tục phát huy trong các tình huống tiếp theo.
                  </>
                ) : (
                  <>
                    Học viên đã thực hiện <strong>{totalTurns}</strong> lượt đàm thoại với điểm trung bình <strong>{avgOverall}%</strong> (chưa đạt ngưỡng tối thiểu <strong>{passingThreshold}%</strong> cho cấp độ {studentLevel}). Cần chú ý phát âm chuẩn xác các từ khóa số, ký hiệu tàu bay, và tuân thủ đúng cấu trúc khẩu lệnh tiêu chuẩn ICAO trong các lần luyện tập kế tiếp.
                  </>
                )}
              </p>
            </div>

            {/* Signatures for Official Report Printout */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-200 text-center text-xs">
              <div>
                <span className="text-slate-500 block mb-12">Học viên xác nhận</span>
                <strong className="text-slate-900 block">{currentUser?.username || currentUser?.name || 'Học viên VIAA'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block mb-12">Giảng viên / Huấn luyện viên trưởng</span>
                <strong className="text-slate-900 block">VIAA Flight Training Department</strong>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-white border-t border-slate-200 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="In ấn trực tiếp"
          >
            <Printer className="w-4 h-4" />
            <span>In ấn</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Tải xuống File PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
