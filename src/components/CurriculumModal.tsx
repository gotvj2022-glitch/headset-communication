import React, { useState } from 'react';
import { SCENARIOS, Scenario } from '../data/scenarios';
import { BookOpen, X, Play, ShieldAlert, Radio, Wrench } from 'lucide-react';

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: Scenario) => void;
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);

  if (!isOpen) return null;

  const currentScenario = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full h-[88vh] flex flex-col shadow-xl text-slate-800 overflow-hidden">
        {/* Top Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/image_7fdc763d.png"
              alt="Victoria Aviation Academy"
              className="h-10 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Giáo Trình VIAA: 10 Kịch Bản Đàm Thoại Mẫu (VJC-VJAA-M-125)
              </h2>
              <p className="text-xs text-slate-500">
                Học viện Hàng không Victoria · Khóa học Communication with Flight Crew
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: List of 10 Scenarios */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto p-3 space-y-2 bg-slate-50/70 shrink-0">
            {[1, 2, 3, 4, 5].map((chap) => {
              const chapScenarios = SCENARIOS.filter((s) => s.chapter === chap);
              if (chapScenarios.length === 0) return null;

              return (
                <div key={chap} className="mb-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                    {chapScenarios[0].chapterTitle}
                  </div>
                  <div className="space-y-1 mt-1">
                    {chapScenarios.map((sc) => {
                      const isSelected = sc.id === selectedId;
                      return (
                        <button
                          key={sc.id}
                          onClick={() => setSelectedId(sc.id)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-red-50 border border-red-300 text-red-900 font-bold shadow-2xs'
                              : 'bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{sc.aircraft}</span>
                            <span
                              className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${
                                sc.difficulty === 'Basic'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : sc.difficulty === 'Intermediate'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {sc.difficulty}
                            </span>
                          </div>
                          <span className="line-clamp-2 text-slate-600 text-[11px] font-normal">
                            {sc.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Main Panel: Scenario Details & Full 10 Pairs */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            {/* Header info card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentScenario.title}</h3>
                  <p className="text-xs text-red-600 font-mono font-semibold mt-0.5">
                    {currentScenario.aircraft} · {currentScenario.flight} · {currentScenario.location}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSelectScenario(currentScenario);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Luyện Tập Kịch Bản Này</span>
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-slate-900">Mục tiêu huấn luyện:</strong> {currentScenario.objective}
              </p>

              {currentScenario.conditions && (
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-700">Điều kiện vận hành:</strong> {currentScenario.conditions}
                </p>
              )}
            </div>

            {/* Prohibited Actions */}
            {currentScenario.prohibitedActions && currentScenario.prohibitedActions.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900">
                <div className="flex items-center gap-2 font-bold text-red-700 mb-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Các hành vi NGHIÊM CẤM tuyệt đối (VIAA / VJC Regulations):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {currentScenario.prohibitedActions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hand Signals Table */}
            {currentScenario.handSignals && currentScenario.handSignals.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cử chỉ tay / Đánh tín hiệu mặt đất chuẩn ICAO:</span>
                </h4>
                <div className="space-y-1.5">
                  {currentScenario.handSignals.map((sig, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded bg-white border border-slate-200 gap-1 shadow-2xs">
                      <span className="font-bold text-red-700">{sig.step}</span>
                      <span className="text-slate-700 font-mono text-[11px]">{sig.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full 10 Pairs Dialogue Script Table */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-600" />
                <span>Kịch bản đối thoại chuẩn 10 cặp (ICAO Standard Script)</span>
              </h4>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-mono font-bold">
                    <tr>
                      <th className="p-2.5 w-12 text-center">Cặp</th>
                      <th className="p-2.5 w-28">Bên phát</th>
                      <th className="p-2.5">Khẩu lệnh chuẩn ICAO (English)</th>
                      <th className="p-2.5">Ý nghĩa chuyên môn (Tiếng Việt)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentScenario.dialoguePairs.map((pair) => (
                      <React.Fragment key={pair.pairIndex}>
                        <tr className="hover:bg-slate-50">
                          <td rowSpan={2} className="p-2.5 font-mono font-bold text-center text-red-600 border-r border-slate-200 bg-slate-50/50">
                            #{pair.pairIndex}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-amber-700">
                            {pair.expectedInitiator === 'Cockpit' ? 'Cockpit' : 'Headset Man'}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">
                            "{pair.expectedInitiator === 'Cockpit' ? pair.cockpitTurn.text : pair.groundTurn.text}"
                          </td>
                          <td className="p-2.5 text-slate-600 italic">
                            {pair.expectedInitiator === 'Cockpit' ? pair.cockpitTurn.vietnamese : pair.groundTurn.vietnamese}
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 bg-slate-50/30">
                          <td className="p-2.5 font-mono font-bold text-red-600">
                            {pair.expectedInitiator === 'Cockpit' ? 'Headset Man' : 'Cockpit'}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">
                            "{pair.expectedInitiator === 'Cockpit' ? pair.groundTurn.text : pair.cockpitTurn.text}"
                          </td>
                          <td className="p-2.5 text-slate-600 italic">
                            {pair.expectedInitiator === 'Cockpit' ? pair.groundTurn.vietnamese : pair.cockpitTurn.vietnamese}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
