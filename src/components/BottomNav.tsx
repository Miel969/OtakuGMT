import React from 'react';
import { Calendar, Radio, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { type RadioStation } from '../services/radioStations';

export type NavTab = 'schedule' | 'radio';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentStation: RadioStation | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  currentStation,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
}: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center p-3 sm:p-5">
      
      {/* Background Bottom Gradient Mask for Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/80 to-transparent pointer-events-none" />

      {/* Floating Audio Mini-Player Bar (Visible when radio is active/playing) */}
      {currentStation && (
        <div className="relative pointer-events-auto w-full max-w-md mb-2 px-3 py-2 rounded-2xl bg-[#0e1017]/95 border border-purple-500/30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPlaying ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400'}`}>
              {isPlaying ? (
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2.5 bg-white animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-white animate-pulse delay-75" />
                  <span className="w-0.5 h-2.5 bg-white animate-pulse delay-150" />
                </div>
              ) : (
                <Radio className="w-4 h-4" />
              )}
            </div>
            
            <div className="overflow-hidden">
              <h5 className="text-xs font-bold text-slate-200 truncate">
                {currentStation.name}
              </h5>
              <p className="text-[10px] text-purple-400 truncate">
                {currentStation.city} · {currentStation.genre}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onTogglePlay}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      )}

      {/* Main Spotify-Style Floating Dock */}
      <nav className="relative pointer-events-auto bg-[#0d0e14]/90 border border-white/10 backdrop-blur-2xl rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 sm:gap-6">
        
        {/* Tab: Schedule */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule</span>
        </button>

        {/* Tab: Radio */}
        <button
          onClick={() => onTabChange('radio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === 'radio'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Radio Radar</span>
          {isPlaying && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

      </nav>

    </div>
  );
}
