import React, { useState } from 'react';
import { 
  Radio as RadioIcon, 
  MapPin, 
  Headphones, 
  History, 
  Disc3,
  Heart,
  Lock,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { 
  JAPAN_STATIONS, 
  type RadioStation, 
  type TrackItem 
} from '../services/radioStations';
import { type UserProfile } from '../services/authService';

interface RadioViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  onSelectStation: (station: RadioStation) => void;
  userProfile?: UserProfile;
  songHistory: TrackItem[];
  loadingHistory: boolean;
  onRemoveLikedTrack: (id: string | number) => void;
  onOpenAuthForHistory: () => void;
}

export default function RadioView({
  currentStation,
  isPlaying,
  onSelectStation,
  userProfile,
  songHistory,
  loadingHistory,
  onRemoveLikedTrack,
  onOpenAuthForHistory,
}: RadioViewProps) {
  const activeStation = currentStation || JAPAN_STATIONS[0];
  const [activeTabSub, setActiveTabSub] = useState<'history' | 'saved'>('history');
  const isLoggedIn = !!userProfile?.isLoggedIn;
  const likedTracks = userProfile?.likedTracks || [];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto pb-12 pt-0">
      
      {/* Main Grid: Accurate Geography Japan Map + Station List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left/Center: Accurate Japan Map Vector Layer (7 Cols) */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-3xl bg-[#0e1017] border border-white/10 relative overflow-hidden flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>GEOGRAPHIC JAPAN PREFECTURE RADAR</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Tap beacon to tune in</span>
          </div>

          {/* Map Vector Container with Clean Minimal Pins (No text labels cluttering the map) */}
          <div className="relative w-full aspect-[1/1] max-w-md sm:max-w-lg flex items-center justify-center">
            
            {/* Ambient Background Grid */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #8b5cf6 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} 
            />

            {/* Actual Geolonia Official Japan Geographic Outline */}
            <img 
              src="/japan-map.svg" 
              alt="Geographic Map of Japan"
              className="w-full h-full object-contain filter invert opacity-35 brightness-150 contrast-125 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)] pointer-events-none select-none"
            />

            {/* Clean Minimal Station Beacons (Zero text labels on dots) */}
            {JAPAN_STATIONS.map((station) => {
              const isSelected = activeStation.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  style={{
                    left: `${station.coordinates.x}%`,
                    top: `${station.coordinates.y}%`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-30 cursor-pointer p-1.5"
                  title={`${station.city} · ${station.name}`}
                >
                  {/* Outer Pulsing Target Ring */}
                  {isSelected && (
                    <span className="absolute -inset-1 rounded-full bg-purple-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Clean Beacon Dot */}
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isSelected 
                      ? 'bg-purple-400 ring-4 ring-purple-500/60 scale-125 shadow-purple-500/60' 
                      : 'bg-slate-600 hover:bg-purple-500 hover:scale-125'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-black' : 'bg-white'}`} />
                  </div>
                </button>
              );
            })}

          </div>
        </div>

        {/* Right: Station Selection Cards + Playlist History & Saved (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Station Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 mb-0.5">
              <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] flex items-center gap-1.5">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span>Radio Stations</span>
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">128–256kbps</span>
            </div>

            {JAPAN_STATIONS.map((station) => {
              const isSelected = activeStation.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`text-left p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30' 
                      : 'bg-[#0e1017] border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                        : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                    }`}>
                      {isSelected && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-2.5">
                          <span className="w-0.5 h-2.5 bg-white animate-pulse" />
                          <span className="w-0.5 h-1.5 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-2.5 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <RadioIcon className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {station.name}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 border border-white/5 text-slate-400 font-mono flex-shrink-0">
                          {station.city}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-400 font-medium truncate mt-0.5">
                        {station.genre}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className="text-[9px] font-mono font-semibold text-emerald-400">
                      {station.bitrate}k
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">
                      {station.region}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dual Drawer: Radio History vs Saved Liked Songs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1017] border border-white/10 flex flex-col gap-3">
            
            {/* Tab switch inside drawer */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTabSub('history')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTabSub === 'history' 
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Radio History</span>
                </button>

                <button
                  onClick={() => setActiveTabSub('saved')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    activeTabSub === 'saved' 
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span>Saved ({likedTracks.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: RADIO HISTORY (Locked for Guests) */}
            {activeTabSub === 'history' && (
              <>
                {!isLoggedIn ? (
                  <div className="py-5 px-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col items-center text-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Sign in to view Radio History
                      </h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                        Create a free OtakuGMT account to unlock live playlist logs, save tracks, and bookmark anime drops.
                      </p>
                    </div>
                    <button
                      onClick={onOpenAuthForHistory}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/30"
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                ) : loadingHistory ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span>Syncing playlist logs...</span>
                  </div>
                ) : songHistory.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {songHistory.slice(0, 6).map((item, idx) => (
                      <div 
                        key={item.id || idx} 
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 text-xs"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-[10px] font-mono text-slate-500 w-3 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <Disc3 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-200 truncate text-[11px]">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {item.artist}
                            </p>
                          </div>
                        </div>

                        {item.album && (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-purple-300 font-mono truncate max-w-[110px] ml-2 flex-shrink-0 hidden sm:inline-block">
                            {item.album}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-3">
                    No history logs available for this station yet.
                  </p>
                )}
              </>
            )}

            {/* TAB 2: SAVED TRACKS */}
            {activeTabSub === 'saved' && (
              <>
                {!isLoggedIn ? (
                  <div className="py-5 px-4 rounded-xl bg-purple-950/20 border border-purple-500/20 flex flex-col items-center text-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Your Liked Songs Library
                      </h4>
                      <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                        Sign in to keep a permanent list of anime tracks you discover on OtakuGMT.
                      </p>
                    </div>
                    <button
                      onClick={onOpenAuthForHistory}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/30"
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                ) : likedTracks.length > 0 ? (
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                    {likedTracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-200 truncate text-[11px]">
                              {track.title}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {track.artist} · <span className="text-purple-400">{track.city}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <a
                            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(track.title + ' ' + track.artist)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Find on YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onRemoveLikedTrack(track.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No saved songs yet! Tap the ❤️ heart icon on any live track to save it here.
                  </p>
                )}
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
