export interface RadioStation {
  id: string;
  name: string;
  region: string;
  city: string;
  prefectureCode: string;
  coordinates: { x: number; y: number };
  genre: string;
  category: 'tokyo-fm' | 'jpop-city' | 'anime-lofi';
  streamUrl: string;
  description: string;
  bitrate: number;
  apiName?: string;
  metadataApiUrl?: string;
  isRealBroadcast?: boolean;
}

export interface TrackItem {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  startedAt?: string;
}

// 100% Active, Verified Direct Streams
export const JAPAN_STATIONS: RadioStation[] = [
  // 🗼 1. REAL JAPANESE TERRESTRIAL BROADCASTER (Tokyo)
  {
    id: 'fm-setagaya',
    name: 'FM Setagaya 83.4',
    region: 'Kanto',
    city: 'Setagaya, Tokyo',
    prefectureCode: '13',
    coordinates: { x: 73, y: 65 },
    genre: 'Live Tokyo Community FM',
    category: 'tokyo-fm',
    streamUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
    metadataApiUrl: 'https://fmsetagaya834.airtime.pro/api/live-info-v2',
    description: 'Official 83.4 MHz live broadcast from Setagaya, Tokyo. Japanese DJs, neighborhood talk, and daytime Tokyo music.',
    bitrate: 128,
    isRealBroadcast: true,
  },

  // 🌸 2. REAL 24/7 J-POP & CITY POP NETWORKS
  {
    id: 'jpop-powerplay',
    name: 'J-Pop Powerplay (Asia DREAM)',
    region: 'Kansai',
    city: 'Osaka / Tokyo',
    prefectureCode: '27',
    coordinates: { x: 53.5, y: 68 },
    genre: 'Trending J-Pop & Modern Rock',
    category: 'jpop-city',
    streamUrl: 'https://kathy.torontocast.com/powerplay',
    description: 'Nonstop high-bitrate Japanese pop charts, idol groups, Yoasobi, King Gnu, Ado, and Official HIGE DANdism.',
    bitrate: 128,
    isRealBroadcast: true,
  },
  {
    id: 'asia-dream-japan',
    name: 'Asia DREAM Japan Hits',
    region: 'Kanto',
    city: 'Shibuya, Tokyo',
    prefectureCode: '13',
    coordinates: { x: 74, y: 64 },
    genre: 'J-Pop Hits & 80s City Pop',
    category: 'jpop-city',
    streamUrl: 'https://quincy.torontocast.com/JapanHits',
    description: 'Broadcasting commercial modern J-Pop billboard hits, classic 80s/90s City Pop, and mainstream Japanese music.',
    bitrate: 128,
    isRealBroadcast: true,
  },

  // 🎧 3. DEDICATED ANIME OST & FANTASY INSTRUMENTAL
  {
    id: 'gensokyo-radio-1',
    name: 'Touhou & Anime Symphony',
    region: 'Kansai',
    city: 'Kyoto',
    prefectureCode: '26',
    coordinates: { x: 55, y: 64 },
    genre: 'Orchestral & Fantasy OST',
    category: 'anime-lofi',
    streamUrl: 'https://stream.gensokyoradio.net/1/',
    description: 'High-fidelity Japanese instrumental music, epic fantasy themes, and community orchestral works.',
    bitrate: 128,
  },
  {
    id: 'gensokyo-radio-3',
    name: 'Kyoto High-Fi Instrumental',
    region: 'Kansai',
    city: 'Kyoto',
    prefectureCode: '26',
    coordinates: { x: 56, y: 65 },
    genre: 'Enhanced 256kbps Anime OST',
    category: 'anime-lofi',
    streamUrl: 'https://stream.gensokyoradio.net/3/',
    description: 'Crystal-clear 256kbps audio stream dedicated to Japanese arrangements and video game soundtracks.',
    bitrate: 256,
  },
];

const WORKER_METADATA_ENDPOINT = 'https://otakugmt-radio-metadata.mefiance999.workers.dev';

export async function fetchCurrentTrack(station: RadioStation): Promise<TrackItem | null> {
  try {
    // 1. Check local dev proxy or Cloudflare Edge NowPlaying Worker
    try {
      const endpoint = import.meta.env.PROD
        ? `${WORKER_METADATA_ENDPOINT}/?station=${encodeURIComponent(station.id)}`
        : `/api/nowplaying?station=${encodeURIComponent(station.id)}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title && data.title !== 'Live Broadcast') {
          return {
            id: Date.now(),
            title: data.title,
            artist: data.artist,
            album: station.name,
            startedAt: data.updatedAt,
          };
        }
      }
    } catch {
      // Fallback to direct APIs below
    }

    // 2. Direct Airtime Pro Live-Info API (FM Setagaya)
    if (station.metadataApiUrl) {
      const res = await fetch(station.metadataApiUrl);
      if (res.ok) {
        const data = await res.json();
        const currentShow = data.shows?.current?.name || '';
        const currentTrack = data.tracks?.current?.name || '';

        if (currentTrack || currentShow) {
          return {
            id: Date.now(),
            title: currentTrack || currentShow,
            artist: station.name,
            album: station.city,
          };
        }
      }
    }

    // 3. Fallback station title
    return {
      id: station.id,
      title: station.genre,
      artist: station.name,
      album: station.city,
    };
  } catch (err) {
    console.warn(`Could not fetch track for ${station.name}:`, err);
    return null;
  }
}

export async function fetchSongHistory(station: RadioStation): Promise<TrackItem[]> {
  try {
    if (station.metadataApiUrl) {
      const res = await fetch(station.metadataApiUrl);
      if (res.ok) {
        const data = await res.json();
        const history: TrackItem[] = [];
        
        if (data.shows?.previous) {
          data.shows.previous.forEach((s: any, idx: number) => {
            history.push({
              id: `prev-${idx}`,
              title: s.name,
              artist: station.name,
              album: station.city,
            });
          });
        }
        return history;
      }
    }
    return [];
  } catch (err) {
    console.warn(`Could not fetch history for ${station.name}:`, err);
    return [];
  }
}
