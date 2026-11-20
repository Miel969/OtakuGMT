import React, { useState, useEffect } from 'react';
import { 
  Radio as RadioIcon, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  MapPin, 
  Music, 
  Signal, 
  Headphones, 
  History, 
  Disc3 
} from 'lucide-react';
import { 
  JAPAN_STATIONS, 
  fetchCurrentTrack, 
  fetchSongHistory, 
  type RadioStation, 
  type TrackItem 
} from '../services/radioStations';

interface RadioViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  onSelectStation: (station: RadioStation) => void;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function RadioView({
  currentStation,
  isPlaying,
  onSelectStation,
  onTogglePlay,
  isMuted,
  onToggleMute,
}: RadioViewProps) {
  const activeStation = currentStation || JAPAN_STATIONS[0];
  const [currentTrack, setCurrentTrack] = useState<TrackItem | null>(null);
  const [songHistory, setSongHistory] = useState<TrackItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Poll current song and track history
  useEffect(() => {
    let isMounted = true;

    const updateData = async () => {
      if (activeStation.apiName) {
        setLoadingHistory(true);
        const [track, history] = await Promise.all([
          fetchCurrentTrack(activeStation.apiName),
          fetchSongHistory(activeStation.apiName),
        ]);
        if (isMounted) {
          setCurrentTrack(track);
          setSongHistory(history);
          setLoadingHistory(false);
        }
      } else {
        if (isMounted) {
          setCurrentTrack(null);
          setSongHistory([]);
          setLoadingHistory(false);
        }
      }
    };

    updateData();
    const interval = setInterval(updateData, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeStation]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#0e1017] to-cyan-950/40 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <RadioIcon className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>DIRECT LIVE BROADCASTS FROM JAPAN</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Space_Grotesk'] mb-2">
            Japan Anime Radio Radar
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Select a neon beacon across the prefectures of Japan to stream live 24/7 anime theme songs, lofi chillout, and Tokyo underground tracks. Ultra-data saver friendly for Ghana (128kbps).
          </p>
        </div>

        {/* Current Active Station Hero Card */}
        <div className="relative z-10 bg-black/60 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-purple-400 font-semibold flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5" />
              {activeStation.city.toUpperCase()} · {activeStation.region}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
              LIVE · {activeStation.bitrate}kbps
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {activeStation.name}
            </h3>
            
            {/* Live Track Display */}
            {currentTrack ? (
              <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <Music className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0 animate-bounce" />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-purple-200 truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-purple-300 font-medium mt-0.5">
                {activeStation.genre}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <button
              onClick={onTogglePlay}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause' : 'Tune In Live'}</span>
            </button>

            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Accurate Geography Japan Map + Station List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left/Center: Accurate Japan Map Vector Layer (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-[#0e1017] border border-white/10 relative overflow-hidden flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>GEOGRAPHIC JAPAN PREFECTURE RADAR</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Real Topographic Projection</span>
          </div>

          {/* Map Vector Container with Absolute Station Beacons */}
          <div className="relative w-full aspect-[1/1] max-w-lg flex items-center justify-center">
            
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

            {/* Interactive Prefecture Beacons Pins */}
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
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none z-30 cursor-pointer"
                >
                  {/* Outer Pulsing Target Ring */}
                  {isSelected && (
                    <span className="absolute -inset-3 rounded-full bg-purple-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Beacon Pin */}
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isSelected 
                      ? 'bg-purple-400 ring-4 ring-purple-500/60 scale-125 shadow-purple-500/60' 
                      : 'bg-slate-700 hover:bg-purple-500 hover:scale-125'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-white'}`} />
                  </div>

                  {/* Prefecture & City Badge Tooltip */}
                  <div className={`absolute left-1/2 -translate-x-1/2 bottom-5 pointer-events-none transition-all duration-200 whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono shadow-2xl flex items-center gap-1 ${
                    isSelected 
                      ? 'bg-purple-600 text-white opacity-100 scale-105 border border-purple-400/50' 
                      : 'bg-black/90 text-slate-300 border border-white/10 opacity-70 group-hover:opacity-100 group-hover:scale-100'
                  }`}>
                    <span>{station.city}</span>
                    <span className="text-[9px] text-purple-200 opacity-70">({station.region})</span>
                  </div>
                </button>
              );
            })}

          </div>

          {/* Map Footer Info */}
          <div className="w-full flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/5 mt-2 font-mono">
            <span>OFFICIAL PREFECTURE DATA · WGS84 MERCATOR</span>
            <span>BEACONS: {JAPAN_STATIONS.length} ACTIVE</span>
          </div>
        </div>

        {/* Right: Station Selection Cards + Playlist History (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Station Selector */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <h2 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                <span>Available Radio Stations</span>
              </h2>
              <span className="text-xs text-slate-500 font-mono">HTTPS Verified</span>
            </div>

            {JAPAN_STATIONS.map((station) => {
              const isSelected = activeStation.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30' 
                      : 'bg-[#0e1017] border-white/5 hover:border-white/15 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors flex-shrink-0 ${
                      isSelected 
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                        : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                    }`}>
                      {isSelected && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-3 bg-white animate-pulse" />
                          <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-3 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <RadioIcon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                          {station.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/5 text-slate-400 font-mono flex-shrink-0">
                          {station.city}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-400 font-medium truncate mt-0.5">
                        {station.genre}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                    <span className="text-[10px] font-mono font-semibold text-emerald-400">
                      {station.bitrate}k
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {station.region}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Recently Played Track History Drawer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1017] border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Recently Played on {activeStation.city}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Live History</span>
            </div>

            {loadingHistory ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span>Syncing playlist logs...</span>
              </div>
            ) : songHistory.length > 0 ? (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
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
                        <p className="font-semibold text-slate-200 truncate">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {item.artist}
                        </p>
                      </div>
                    </div>

                    {item.album && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-purple-300 font-mono truncate max-w-[120px] ml-2 flex-shrink-0 hidden sm:inline-block">
                        {item.album}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-3">
                Live track history is available for stations with broadcast logs.
              </p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
