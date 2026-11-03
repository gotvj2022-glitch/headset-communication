import React, { useState } from 'react';
import { AVIATION_PROWORDS, NATO_PHONETIC_ALPHABET } from '../data/scenarios';
import { BookOpen, X, Search, Volume2, CheckCircle2, AlertCircle } from 'lucide-react';
import { speakWithBrowserTts } from '../utils/audioPlayer';

interface ProwordGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProwordGlossaryModal: React.FC<ProwordGlossaryModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'prowords' | 'nato'>('prowords');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredProwords = AVIATION_PROWORDS.filter(
    (p) =>
      p.proword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vietnamese.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const natoEntries = Object.entries(NATO_PHONETIC_ALPHABET).filter(([char, name]) =>
    char.toLowerCase().includes(searchTerm.toLowerCase()) ||
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-xl text-slate-800 overflow-hidden">
        {/* Header */}
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
                Sổ Tra Cứu Thuật Ngữ Prowords & Bảng Chữ Cái NATO
              </h2>
              <p className="text-xs text-slate-500">
                Học viện Hàng không Victoria (VIAA) · Chuẩn ICAO Annex 10
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

        {/* Search & Tabs Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg w-full sm:w-auto shadow-2xs">
            <button
              onClick={() => setActiveTab('prowords')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'prowords' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              10 Prowords Trọng Tâm
            </button>
            <button
              onClick={() => setActiveTab('nato')}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'nato' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bảng Chữ Cái NATO (A-Z & Số)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nhanh thuật ngữ..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-mono shadow-2xs"
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {activeTab === 'prowords' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredProwords.map((pw) => (
                <div
                  key={pw.proword}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-red-300 transition-colors shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black font-mono tracking-wider text-red-600">
                        {pw.proword}
                      </span>
                      <button
                        onClick={() => speakWithBrowserTts(pw.proword, 'Ground')}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mb-1">
                      {pw.meaning}
                    </p>
                    <p className="text-xs text-slate-500 italic mb-3">
                      Tiếng Việt: {pw.vietnamese}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px]">
                    <div className="flex items-start gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Khi dùng:</strong> {pw.whenToUse}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-red-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>KHÔNG dùng khi:</strong> {pw.notUsedWhen}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                <span className="font-bold text-amber-800 block mb-1">
                  Ví dụ đánh vần đăng bạ máy bay & hướng đẩy trong bài tập VIAA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-mono text-[11px] mt-2">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-red-600 font-bold">VN-A649</span>: Victor - November - Alfa - Six - Four - Niner
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-red-600 font-bold">NORTH</span>: November - Oscar - Romeo - Tango - Hotel
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-red-600 font-bold">VJ100</span>: Victor - Juliett - Wun - Zero - Zero
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-red-600 font-bold">SGN Stand E05</span>: Sierra - Golf - November / Stand Echo Zero Fife
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {natoEntries.map(([char, name]) => (
                  <div
                    key={char}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-red-300 transition-colors shadow-2xs"
                  >
                    <div>
                      <span className="text-lg font-black font-mono text-red-600 block">
                        {char}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-700 block">
                        {name}
                      </span>
                    </div>
                    <button
                      onClick={() => speakWithBrowserTts(name, 'Cockpit')}
                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
