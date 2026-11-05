import React, { useState } from 'react';
import { PracticeSessionHistory } from '../types';
import { History, X, Trash2, Calendar, ChevronDown, ChevronUp, RotateCcw, Award } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyList: PracticeSessionHistory[];
  onClearHistory: () => void;
  onLoadSessionToReview: (session: PracticeSessionHistory) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyList,
  onClearHistory,
  onLoadSessionToReview
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border-l border-slate-200 w-full max-w-xl h-full flex flex-col shadow-2xl text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 border border-red-300 flex items-center justify-center text-red-600">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lịch Sử Huấn Luyện & Bài Kiểm Tra</h2>
              <p className="text-xs text-slate-500">{historyList.length} phiên đã lưu trong hồ sơ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {historyList.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                title="Xóa toàn bộ hồ sơ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {historyList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <History className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">Chưa có kết quả nào được lưu</p>
              <p className="text-xs mt-1 text-slate-500">
                Sau khi hoàn tất bài tập hoặc bài kiểm tra, nhấn "Lưu Vào Hồ Sơ" để xem lại tiến trình học viên.
              </p>
            </div>
          ) : (
            historyList.map((session) => {
              const isExpanded = expandedId === session.id;
              const isGood = session.overallScore > 90;
              const isPassed = session.overallScore >= 80 && session.overallScore <= 90;

              return (
                <div
                  key={session.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                    className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{session.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-semibold text-red-600">
                          {session.practiceMode === 'exam'
                            ? 'Bài Kiểm Tra Quá Trình'
                            : session.practiceMode === 'free'
                            ? 'Đối Thoại Tự Do'
                            : 'Kịch Bản Chuẩn'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                        {session.scenarioTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Vai: {session.userRole === 'Ground' ? 'Headset Man' : 'Phi công'} · Cấp độ: {session.studentLevel}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span
                          className={`text-lg font-black font-mono ${
                            isGood ? 'text-emerald-600' : isPassed ? 'text-amber-600' : 'text-red-600'
                          }`}
                        >
                          {session.overallScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">/100</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Conversation Review */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                        <span className="text-[11px] font-bold text-slate-600">
                          Chi tiết các lượt thoại ({session.messages.length}):
                        </span>
                        <button
                          onClick={() => {
                            onLoadSessionToReview(session);
                            onClose();
                          }}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Xem trên màn hình</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {session.messages.map((m, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg border text-[11px] ${
                              m.isUser
                                ? 'bg-red-50/50 border-red-200 text-slate-900 ml-3'
                                : 'bg-white border-slate-200 text-slate-800 mr-3 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-mono font-bold text-[10px] text-slate-600">
                                {m.sender} ({m.isUser ? 'Bạn' : 'AI'})
                              </span>
                              {m.evaluation && (
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    m.evaluation.overallScore > 90
                                      ? 'text-emerald-700'
                                      : m.evaluation.overallScore >= 80
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                  }`}
                                >
                                  {m.evaluation.overallScore}/100 ({m.evaluation.rubricLevel})
                                </span>
                              )}
                            </div>
                            <p className="font-mono font-bold">"{m.text}"</p>
                            {m.vietnamese && (
                              <p className="text-[10px] text-slate-500 italic mt-0.5">
                                {m.vietnamese}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
