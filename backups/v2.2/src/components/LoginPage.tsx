import React, { useState, useRef } from 'react';
import { ShieldCheck, User, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export interface UserSession {
  username: string;
  role: 'Admin' | 'Student';
  displayName: string;
}

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // Account 1: User: Test / Pass: 123
    if (cleanUser.toLowerCase() === 'test' && cleanPass === '123') {
      onLoginSuccess({
        username: 'Test',
        role: 'Student',
        displayName: 'Học viên Test (VIAA Student)',
      });
      return;
    }

    // Account 2: User: Admin / Pass: VIAA
    if (cleanUser.toLowerCase() === 'admin' && cleanPass === 'VIAA') {
      onLoginSuccess({
        username: 'Admin',
        role: 'Admin',
        displayName: 'Quản trị viên / Giảng viên (VIAA Admin)',
      });
      return;
    }

    setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
  };

  const handleQuickFill = (u: string, p: string, autoFocusPassword = false) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
    if (autoFocusPassword) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/40 flex flex-col justify-between p-4 sm:p-6 text-slate-800">
      {/* Top Brand Bar */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <img
            src="/assets/aistudio/image_7fdc763d.png"
            alt="VIAA Logo"
            className="h-9 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-mono font-black text-red-600 tracking-wider text-base">VIAA</span>
        </div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white/80 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
          Aviation Portal · v2.2
        </span>
      </div>

      {/* Main Centered Login Card */}
      <div className="max-w-md w-full mx-auto my-auto animate-scaleIn">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 p-6 sm:p-7 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-sm pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-amber-400/20 rounded-full blur-sm pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center mb-3 ring-4 ring-white/20">
                <img
                  src="/assets/aistudio/image_7fdc763d.png"
                  alt="VIAA Emblem"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                HỌC VIỆN HÀNG KHÔNG VICTORIA
              </h1>
              <p className="text-xs sm:text-sm text-amber-200 font-bold tracking-wide mt-1 uppercase">
                Headset Communication - AI TUTOR ASSISTANT
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8 space-y-5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập 'Test' hoặc 'Admin'"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-sm rounded-xl shadow-md shadow-red-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
              </button>
            </form>

            {/* Quick Fill / Demo Accounts Helper */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Tài khoản truy cập mẫu (Bấm để điền nhanh):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* User 1: Test / 123 (Kept intact as user requested) */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('Test', '123')}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100/80 text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-0.5">
                    <span>User 1: Test</span>
                    <span className="text-[10px] text-amber-700 bg-white px-1.5 py-0.2 rounded border border-amber-200 font-semibold">
                      Học viên
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    Pass: <span className="font-bold text-red-600">123</span>
                  </div>
                </button>

                {/* User 2: Admin (Password hidden, requires manual typing) */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('Admin', '', true)}
                  className="p-2.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100/80 text-left transition-colors cursor-pointer group"
                  title="Bấm để điền tên 'Admin', sau đó tự nhập mật khẩu bằng tay"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-red-900 mb-0.5">
                    <span>User 2: Admin</span>
                    <span className="text-[10px] text-red-700 bg-white px-1.5 py-0.2 rounded border border-red-200 font-semibold">
                      Giảng viên
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Mật khẩu:</span>
                    <span className="font-semibold text-slate-700 italic">Nhập bằng tay ✍️</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer security badge */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-600">A project from VIAA-GOT with AIstudio</span>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center py-2 text-xs text-slate-400">
        © {new Date().getFullYear()} Victoria Aviation Academy (VIAA). Bảo lưu mọi quyền.
      </div>
    </div>
  );
};
