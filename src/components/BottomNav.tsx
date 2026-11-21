import React from 'react';
import { Calendar, Radio, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { type RadioStation, type TrackItem } from '../services/radioStations';

export type NavTab = 'schedule' | 'radio';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentStation: RadioStation | null;
  currentTrack: TrackItem | null;
  isPlaying: boolean;
  isBuffering?: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  currentStation,
  currentTrack,
  isPlaying,
  isBuffering = false,
  onTogglePlay,
  isMuted,
  onToggleMute,
}: BottomNavProps) {
  const displayTitle = currentTrack?.title || (currentStation ? currentStation.name : '');
  const displaySubtitle = isBuffering 
    ? 'Reconnecting live broadcast...' 
    : (currentTrack?.artist !== currentStation?.name 
        ? currentTrack?.artist 
        : `${currentStation?.city} · ${currentStation?.genre}`);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center p-3 sm:p-5">
      
      {/* Subtle Spotify Dark Gradient Mask Behind Bar */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Floating Audio Mini-Player Bar (Clean Spotify Pill) */}
      {currentStation && (
        <div className="relative pointer-events-auto w-full max-w-sm mb-2.5 px-3 py-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          
          <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isPlaying ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-white/5 text-slate-400'}`}>
              {isBuffering && isPlaying ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : isPlaying ? (
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2.5 bg-white animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-white animate-pulse delay-75" />
                  <span className="w-0.5 h-2 bg-white animate-pulse delay-150" />
                </div>
              ) : (
                <Radio className="w-4 h-4" />
              )}
            </div>
            
            <div className="overflow-hidden flex-1 min-w-0">
              <h5 className="text-xs font-bold text-slate-100 truncate">
                {displayTitle}
              </h5>
              <p className="text-[10px] text-purple-300/90 truncate font-medium">
                {displaySubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-all shadow-md shadow-white/10"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
            </button>

            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-full text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      )}

      {/* Main Spotify Mobile Nav Dock (Ultra-transparent, icon-only) */}
      <nav className="relative pointer-events-auto bg-black/40 border border-white/10 backdrop-blur-3xl rounded-full px-5 py-2 shadow-2xl flex items-center gap-8">
        
        {/* Tab: Schedule */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`relative p-2 rounded-full transition-all ${
            activeTab === 'schedule'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Schedule"
        >
          <Calendar className="w-5 h-5" />
          {activeTab === 'schedule' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
          )}
        </button>

        {/* Tab: Radio */}
        <button
          onClick={() => onTabChange('radio')}
          className={`relative p-2 rounded-full transition-all ${
            activeTab === 'radio'
              ? 'text-white scale-110'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Radio Radar"
        >
          <Radio className="w-5 h-5" />
          {activeTab === 'radio' && (
            <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
          )}
        </button>

      </nav>

    </div>
  );
}
