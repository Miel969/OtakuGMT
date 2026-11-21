import React from 'react';
import { 
  Headphones, 
  MapPin,
  Sparkles,
  Signal
} from 'lucide-react';
import { 
  JAPAN_STATIONS, 
  type RadioStation 
} from '../services/radioStations';

interface RadioViewProps {
  currentStation: RadioStation | null;
  isPlaying: boolean;
  onSelectStation: (station: RadioStation) => void;
}

export default function RadioView({
  currentStation,
  isPlaying,
  onSelectStation,
}: RadioViewProps) {
  const activeStation = currentStation || JAPAN_STATIONS[0];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-24 pt-2">
      
      {/* 2-Column Clean Layout: Floating Map on Left, Stations List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Geographic Japan Vector Layer (No Card / Zero Border) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative py-4 sm:py-8">
          
          <div className="w-full flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
              <MapPin className="w-4 h-4 text-purple-400" />
              <span>GEOGRAPHIC JAPAN RADAR</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Tap beacon to switch</span>
          </div>

          {/* Map Vector Container with Floating Radar Beacons */}
          <div className="relative w-full aspect-[1/1] max-w-md sm:max-w-lg flex items-center justify-center">
            
            {/* Ambient Background Grid */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #8b5cf6 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }} 
            />

            {/* Official Geographic Japan Map Outline */}
            <img 
              src="/japan-map.svg" 
              alt="Geographic Map of Japan"
              className="w-full h-full object-contain filter invert opacity-30 brightness-150 contrast-125 drop-shadow-[0_0_25px_rgba(139,92,246,0.25)] pointer-events-none select-none"
            />

            {/* Dynamic Station Pins directly on the map */}
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
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group p-2 cursor-pointer transition-transform duration-300 ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                  }`}
                  title={`${station.name} (${station.city})`}
                >
                  {/* Glowing Radar Pulse Effect if Active */}
                  {isSelected && (
                    <span className="absolute inset-0 rounded-full bg-purple-500/40 animate-ping duration-1000" />
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

        {/* Right Column: Clean Borderless Station Selection Rows */}
        <div className="lg:col-span-5 flex flex-col gap-2 pt-2">
          
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-sm font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-400" />
              <span>Japanese Broadcasters</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">100% HTTPS</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {JAPAN_STATIONS.map((station) => {
              const isSelected = activeStation.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`text-left px-4 py-3 rounded-2xl transition-all duration-200 flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-purple-950/20 border border-purple-500/40 shadow-lg shadow-purple-950/30' 
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/5 text-slate-400 group-hover:text-purple-300'
                    }`}>
                      {isSelected && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 h-3 bg-white animate-pulse" />
                          <span className="w-0.5 h-1.5 bg-white animate-pulse delay-75" />
                          <span className="w-0.5 h-2 bg-white animate-pulse delay-150" />
                        </div>
                      ) : (
                        <Signal className="w-4 h-4" />
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xs font-bold truncate transition-colors ${
                          isSelected ? 'text-purple-300' : 'text-slate-200 group-hover:text-white'
                        }`}>
                          {station.name}
                        </h3>
                        {station.isRealBroadcast && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            LIVE FM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {station.genre} · {station.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                    <span className="text-[10px] font-mono font-semibold text-purple-400/80">
                      {station.bitrate}k
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                      {station.region}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
