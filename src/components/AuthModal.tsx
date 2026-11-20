import React, { useState } from 'react';
import { X, Sparkles, Heart, Lock, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTrackTitle?: string;
  onSuccess: (username: string) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  pendingTrackTitle,
  onSuccess,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onSuccess(username.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e1017] border border-purple-500/30 p-6 sm:p-8 shadow-2xl shadow-purple-950/50 flex flex-col gap-5 overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Heart className="w-6 h-6 text-white fill-white animate-pulse" />
          </div>

          <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mt-1">
            {isSignUp ? 'Join the OtakuGMT Crew' : 'Welcome Back Otaku'}
          </h3>

          {pendingTrackTitle ? (
            <p className="text-xs text-purple-300 bg-purple-950/40 border border-purple-500/20 px-3 py-1.5 rounded-xl font-medium">
              Create an account to auto-save: <br />
              <strong className="text-white">"{pendingTrackTitle}"</strong>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Unlock saved track bookmarks, recent radio history, and live community perks.
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-1">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Username or Otaku Handle
            </label>
            <input
              type="text"
              required
              placeholder="e.g. GojoAccra, LeviGh"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none text-sm text-slate-100 placeholder-slate-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSignUp ? 'Sign Up & Save Song' : 'Log In & Save Song'}</span>
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-slate-400 hover:text-purple-300 transition-colors font-medium"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}
