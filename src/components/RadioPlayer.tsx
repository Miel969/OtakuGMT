import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio as RadioIcon, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Signal
} from 'lucide-react';
import { CURATED_STATIONS, type RadioStation } from '../services/radio';

export function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStation, setSelectedStation] = useState<RadioStation>(CURATED_STATIONS[0]);
  const [isMuted, setIsMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const handleWaiting = () => setLoadingAudio(true);
    const handlePlaying = () => {
      setLoadingAudio(false);
      setIsPlaying(true);
      setHasError(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setLoadingAudio(false);
      setIsPlaying(false);
      setHasError(true);
    };

    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setLoadingAudio(true);
      setHasError(false);
      if (audioRef.current.src !== selectedStation.streamUrl) {
        audioRef.current.src = selectedStation.streamUrl;
      }
      try {
        await audioRef.current.play();
      } catch (err) {
        console.error('Audio playback blocked or failed:', err);
        setHasError(true);
        setLoadingAudio(false);
      }
    }
  };

  const switchStation = async (station: RadioStation) => {
    setSelectedStation(station);
    setHasError(false);
    if (!audioRef.current) return;

    audioRef.current.src = station.streamUrl;
    setLoadingAudio(true);
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (e) {
      console.warn('Playback error on switch:', e);
      setHasError(true);
      setLoadingAudio(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[94%] max-w-xl z-50 transition-all">
      {/* Station Selector Dropup Drawer */}
      {expanded && (
        <div className="mb-2 p-3 rounded-2xl bg-[#0f1118]/95 backdrop-blur-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-purple-400" />
              Live Anime & Tokyo Radio Streams
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">100% HTTPS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {CURATED_STATIONS.map((station) => {
              const isActive = station.id === selectedStation.id;
              return (
                <button
                  key={station.id}
                  onClick={() => switchStation(station)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                    isActive 
                      ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200 shadow-sm' 
                      : 'hover:bg-white/5 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold truncate">{station.name}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{station.location}</span>
                      <span>·</span>
                      <span className="uppercase text-[9px] text-purple-400 font-bold">{station.genre}</span>
                    </p>
                  </div>
                  {isActive && isPlaying && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-4 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-2 bg-purple-400 rounded-full animate-bounce" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Persistent Floating Player Bar */}
      <div className="px-3 sm:px-4 py-2.5 rounded-2xl bg-[#0c0d13]/90 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-between gap-3">
        
        {/* Left: Station Info & Equalizer Graphic */}
        <div 
          onClick={() => setExpanded(!expanded)} 
          className="flex items-center gap-3 cursor-pointer select-none group min-w-0"
        >
          <div className="relative w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <RadioIcon className={`w-4 h-4 ${isPlaying ? 'text-purple-400 animate-pulse' : 'text-slate-400'}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0c0d13]" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                {selectedStation.name}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-white/5 text-purple-400 uppercase">
                {selectedStation.genre}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>{hasError ? 'Stream temporarily unavailable' : selectedStation.location}</span>
              <span>·</span>
              <span className="text-purple-400 group-hover:underline">change</span>
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Big Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={loadingAudio}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${
              isPlaying
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
                : 'bg-white text-black hover:bg-slate-200 shadow-white/10'
            }`}
            title={isPlaying ? 'Pause Radio' : 'Play Live Radio'}
          >
            {loadingAudio ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Expand / Minimize Drawer Toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Browse stations"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

        </div>

      </div>
    </div>
  );
}
