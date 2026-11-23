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
  onOpenNowPlaying?: () => void;
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
  onOpenNowPlaying,
}: BottomNavProps) {
  const displayTitle = currentTrack?.title || (currentStation ? currentStation.name : '');
  const displaySubtitle = isBuffering 
    ? 'Reconnecting live broadcast...' 
    : (currentTrack?.artist !== currentStation?.name 
        ? currentTrack?.artist 
        : `${currentStation?.city} · ${currentStation?.genre}`);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex flex-col items-center">
      
      {/* Floating Audio Mini-Player Bar (Clean Spotify Pill above nav) */}
      {currentStation && (
        <div className="pointer-events-auto w-full max-w-md px-3 mb-2">
          <div 
            onClick={onOpenNowPlaying}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#16161a]/95 border border-white/10 backdrop-blur-2xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:bg-[#1f1f25]/95 transition-colors group"
          >
            
            <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isPlaying ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'bg-white/5 text-slate-400'}`}>
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
                <h5 className="text-xs font-bold text-slate-100 truncate group-hover:text-purple-300 transition-colors">
                  {displayTitle}
                </h5>
                <p className="text-[10px] text-purple-300/90 truncate font-medium">
                  {displaySubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}

      {/* Spotify Bottom Navigation Bar: Flat on screen, completely borderless, edge-to-edge */}
      <nav className="pointer-events-auto w-full bg-black/80 backdrop-blur-2xl py-3 px-16 flex items-center justify-around border-none shadow-2xl">
        
        {/* Tab: Schedule */}
        <button
          onClick={() => onTabChange('schedule')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'schedule'
              ? 'text-white scale-110'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Schedule"
        >
          <Calendar className="w-6 h-6 stroke-[1.75]" />
        </button>

        {/* Tab: Radio */}
        <button
          onClick={() => onTabChange('radio')}
          className={`flex flex-col items-center justify-center transition-all ${
            activeTab === 'radio'
              ? 'text-white scale-110'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          title="Radio Radar"
        >
          <Radio className="w-6 h-6 stroke-[1.75]" />
        </button>

      </nav>

    </div>
  );
}
