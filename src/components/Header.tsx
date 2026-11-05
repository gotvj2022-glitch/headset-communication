import React from 'react';
import { BookOpen, History, RotateCcw, HelpCircle, LogOut, User as UserIcon, Shield, GraduationCap, FileText } from 'lucide-react';
import { UserSession } from './LoginPage';

interface HeaderProps {
  onNewSession: () => void;
  onOpenGlossary: () => void;
  onOpenHistory: () => void;
  onOpenCurriculum: () => void;
  onOpenInstructorIntro?: () => void;
  onOpenReport?: () => void;
  activeTab: 'practice' | 'curriculum' | 'glossary' | 'history';
  setActiveTab: (tab: 'practice' | 'curriculum' | 'glossary' | 'history') => void;
  currentUser?: UserSession | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNewSession,
  onOpenGlossary,
  onOpenHistory,
  onOpenCurriculum,
  onOpenInstructorIntro,
  onOpenReport,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-red-100 shadow-xs shrink-0 z-40">
      {/* Zone 1: Brand title with Victoria Aviation Academy Logo */}
      <div className="flex items-center gap-3.5 whitespace-nowrap shrink-0">
        <img
          src="/assets/aistudio/image_7fdc763d.png"
          alt="Victoria Aviation Academy Logo"
          className="h-10 sm:h-12 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg font-black tracking-tight text-red-600 font-mono">
              VIAA
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
              v2.2
            </span>
          </div>
          <span className="hidden sm:inline text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            HỌC VIỆN HÀNG KHÔNG VICTORIA
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 single-line clean text navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('practice')}
          className={`hover:text-red-600 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            activeTab === 'practice' ? 'text-red-600 border-red-600 font-bold' : 'border-transparent'
          }`}
        >
          Buồng Luyện Tập
        </button>
        <button
          onClick={onOpenCurriculum}
          className={`hover:text-red-600 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'curriculum' ? 'text-red-600 border-red-600 font-bold' : 'border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          10 Kịch Bản Mẫu
        </button>
        <button
          onClick={onOpenGlossary}
          className={`hover:text-red-600 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'glossary' ? 'text-red-600 border-red-600 font-bold' : 'border-transparent'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Sổ Tra Prowords & NATO
        </button>
        <button
          onClick={onOpenHistory}
          className={`hover:text-red-600 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
            activeTab === 'history' ? 'text-red-600 border-red-600 font-bold' : 'border-transparent'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Lịch Sử Bài Kiểm Tra
        </button>
      </nav>

      {/* Zone 3: Primary actions & User Account */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* User Account Info Pill */}
        {currentUser && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                currentUser.role === 'Admin'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-amber-500 text-white shadow-2xs'
              }`}
            >
              {currentUser.role === 'Admin' ? (
                <Shield className="w-3.5 h-3.5" />
              ) : (
                <UserIcon className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight font-medium">
                {currentUser.role === 'Admin' ? 'Giảng viên VIAA' : 'Học viên'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onOpenHistory}
          className="lg:hidden p-2 text-slate-600 hover:text-red-600 bg-slate-50 border border-slate-200 rounded-lg"
          title="Lịch sử đàm thoại"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={onOpenGlossary}
          className="lg:hidden p-2 text-slate-600 hover:text-red-600 bg-slate-50 border border-slate-200 rounded-lg"
          title="Tra cứu Prowords"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {onOpenInstructorIntro && (
          <button
            onClick={onOpenInstructorIntro}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Xem clip giáo viên giới thiệu & thiết lập bài học"
          >
            <GraduationCap className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Menu Khóa Học</span>
          </button>
        )}

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Lưu báo cáo & Xuất PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden md:inline">Save Report</span>
          </button>
        )}

        <button
          onClick={onNewSession}
          className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Phiên Mới</span>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 sm:px-2.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">Đăng xuất</span>
          </button>
        )}
      </div>
    </header>
  );
};
