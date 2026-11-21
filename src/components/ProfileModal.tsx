import React, { useState } from 'react';
import { X, User, Heart, History, LogOut, ExternalLink, Calendar } from 'lucide-react';
import { type UserProfile } from '../services/authService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  userProfile,
  onLogout,
  onOpenAuth,
}: ProfileModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'saved' | 'history'>('saved');

  if (!isOpen) return null;

  const isLoggedIn = !!userProfile?.isLoggedIn;
  const likedTracks = userProfile?.likedTracks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0e1017] border border-white/10 p-6 shadow-2xl flex flex-col gap-5 overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isLoggedIn ? userProfile.username : 'Otaku Guest'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isLoggedIn ? 'OtakuGMT Member' : 'Session not saved'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auth prompt if not logged in */}
        {!isLoggedIn ? (
          <div className="py-4 px-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex flex-col items-center text-center gap-2">
            <p className="text-xs text-slate-300">
              Sign in to sync your reminders and saved radio tracks across devices.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="mt-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 transition-all"
            >
              Sign In / Sign Up
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 px-1 border-t border-white/5 pt-3">
            <span>Logged in as <strong className="text-white">{userProfile.username}</strong></span>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

        {/* Sub Tabs: Saved Songs vs History */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <button
            onClick={() => setActiveSubTab('saved')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'saved'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Saved Tracks ({likedTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeSubTab === 'history'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Session History</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[140px] max-h-60 overflow-y-auto">
          {activeSubTab === 'saved' ? (
            likedTracks.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-slate-500 gap-1.5">
                <Heart className="w-6 h-6 text-slate-600" />
                <span>No saved tracks yet.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {likedTracks.map((t, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white line-clamp-1">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.artist} · {t.stationName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center text-xs text-slate-500 gap-1.5">
              <History className="w-6 h-6 text-slate-600" />
              <span>Broadcast history is logged when tracks are identified.</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
