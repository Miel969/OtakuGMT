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
  // 🗼 1. REAL JAPANESE TERRESTRIAL COMMUNITY BROADCASTER (Tokyo)
  {
    id: 'fm-setagaya',
    name: 'FM Setagaya (83.4MHz)',
    region: 'Kanto',
    city: 'Setagaya, Tokyo',
    prefectureCode: '13',
    coordinates: { x: 73, y: 65 },
    genre: 'Tokyo Community FM',
    category: 'tokyo-fm',
    streamUrl: 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
    metadataApiUrl: 'https://fmsetagaya834.airtime.pro/api/live-info-v2',
    description: 'Official 83.4 MHz live community broadcast from Setagaya, Tokyo (JOZZ3BA-FM). Japanese DJs, local talk, and daytime music.',
    bitrate: 128,
  },

  // 🌸 2. REAL 24/7 J-POP & CITY POP NETWORKS
  {
    id: 'jpop-powerplay',
    name: 'Asia DREAM Radio - Japan',
    region: 'Kansai',
    city: 'Osaka / Tokyo',
    prefectureCode: '27',
    coordinates: { x: 53.5, y: 68 },
    genre: 'Trending J-Pop & Modern Rock',
    category: 'jpop-city',
    streamUrl: 'https://kathy.torontocast.com/powerplay',
    description: '24/7 Japanese pop radio network broadcasting modern J-Pop charts, idol groups, and top Japanese hits.',
    bitrate: 128,
  },
  {
    id: 'asia-dream-japan',
    name: 'Asia DREAM Radio - Japan Hits',
    region: 'Kanto',
    city: 'Shibuya, Tokyo',
    prefectureCode: '13',
    coordinates: { x: 74, y: 64 },
    genre: 'J-Pop Hits & 80s City Pop',
    category: 'jpop-city',
    streamUrl: 'https://quincy.torontocast.com/JapanHits',
    description: 'Commercial modern Japanese billboard hits, classic 80s/90s City Pop, and mainstream Japanese music.',
    bitrate: 128,
  },

  // 🎧 3. DEDICATED ANIME DOUJIN & GAME ARRANGEMENT BROADCASTS
  {
    id: 'gensokyo-radio-1',
    name: 'Gensokyo Radio',
    region: 'Kansai',
    city: 'Kyoto',
    prefectureCode: '26',
    coordinates: { x: 55, y: 64 },
    genre: 'Touhou & Doujin Music',
    category: 'anime-lofi',
    streamUrl: 'https://stream.gensokyoradio.net/1/',
    description: '24/7 dedicated broadcast of Touhou Project music, Japanese doujin circles, and orchestral arrangements.',
    bitrate: 128,
  },
  {
    id: 'gensokyo-radio-3',
    name: 'Gensokyo Radio (256kbps HD)',
    region: 'Kansai',
    city: 'Kyoto',
    prefectureCode: '26',
    coordinates: { x: 56, y: 65 },
    genre: 'Anime & Game OST (HD)',
    category: 'anime-lofi',
    streamUrl: 'https://stream.gensokyoradio.net/3/',
    description: 'High-definition 256kbps audio stream dedicated to Japanese arrangements and video game soundtracks.',
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
