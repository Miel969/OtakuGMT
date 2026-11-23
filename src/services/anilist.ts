export interface AiringScheduleItem {
  id: number;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
  media: {
    id: number;
    title: {
      romaji: string;
      english?: string;
      native?: string;
    };
    coverImage: {
      large: string;
      extraLarge: string;
      color?: string;
    };
    bannerImage?: string;
    genres: string[];
    averageScore?: number;
    popularity?: number;
    format?: string;
    description?: string;
    studios?: {
      nodes?: {
        name: string;
      }[];
    };
    siteUrl?: string;
  };
}

const WEEKLY_AIRING_QUERY = `
query GetWeeklyAiringSchedule($airingAtGreater: Int, $airingAtLesser: Int, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    airingSchedules(
      airingAt_greater: $airingAtGreater,
      airingAt_lesser: $airingAtLesser,
      notYetAired: true,
      sort: TIME
    ) {
      id
      episode
      airingAt
      timeUntilAiring
      media {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          extraLarge
          color
        }
        bannerImage
        genres
        averageScore
        popularity
        format
        description(asHtml: false)
        studios(isMain: true) {
          nodes {
            name
          }
        }
        siteUrl
      }
    }
  }
}
`;

export async function fetchWeeklyAiringAnime(): Promise<AiringScheduleItem[]> {
  try {
    const nowUnix = Math.floor(Date.now() / 1000);
    const oneWeekLaterUnix = nowUnix + 7 * 24 * 3600;

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: WEEKLY_AIRING_QUERY,
        variables: {
          airingAtGreater: nowUnix,
          airingAtLesser: oneWeekLaterUnix,
          perPage: 40,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList HTTP error: ${response.status}`);
    }

    const json = await response.json();
    const schedules: AiringScheduleItem[] = json.data?.Page?.airingSchedules || [];

    // Filter out potential duplicates if multiple episodes of the same show air in the same week
    const seenMediaIds = new Set<number>();
    const uniqueList: AiringScheduleItem[] = [];

    for (const item of schedules) {
      if (!seenMediaIds.has(item.media.id)) {
        seenMediaIds.add(item.media.id);
        uniqueList.push(item);
      }
    }

    return uniqueList.length > 0 ? uniqueList : getFallbackWeeklyAnime();
  } catch (err) {
    console.error('Failed to fetch weekly schedule from AniList:', err);
    return getFallbackWeeklyAnime();
  }
}

function getFallbackWeeklyAnime(): AiringScheduleItem[] {
  const now = Math.floor(Date.now() / 1000);
  return [
    {
      id: 101,
      episode: 8,
      airingAt: now + 3600 * 3 + 1200,
      timeUntilAiring: 3600 * 3 + 1200,
      media: {
        id: 1,
        title: {
          romaji: 'Kusuriya no Hitorigoto 2nd Season',
          english: 'The Apothecary Diaries Season 2',
        },
        coverImage: {
          large: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
          extraLarge: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
          color: '#10b981',
        },
        genres: ['Drama', 'Mystery'],
        averageScore: 88,
        popularity: 142500,
        format: 'TV',
        description: 'Maomao, a young woman trained in herbal medicine, is forced to work as a lowly servant in the inner palace. When she solves the mysterious illness afflicting the emperor\'s infants, she catches the eye of an influential eunuch named Jinshi.',
        studios: { nodes: [{ name: 'TOHO animation STUDIO' }, { name: 'OLM' }] },
        siteUrl: 'https://anilist.co/anime/170112',
      },
    },
    {
      id: 102,
      episode: 9,
      airingAt: now + 3600 * 9 + 1800,
      timeUntilAiring: 3600 * 9 + 1800,
      media: {
        id: 2,
        title: {
          romaji: 'Ore dake Level Up na Ken Season 2',
          english: 'Solo Leveling Season 2: Arise from the Shadow',
        },
        coverImage: {
          large: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
          extraLarge: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
          color: '#3b82f6',
        },
        genres: ['Action', 'Fantasy'],
        averageScore: 86,
        popularity: 198000,
        format: 'TV',
        description: 'They say whatever doesn\'t kill you makes you stronger, but that\'s not the case for the world\'s weakest hunter, Sung Jinwoo. After surviving a harrowing double dungeon, he unlocks an enigmatic System that turns him into the world\'s only player who can level up endlessly.',
        studios: { nodes: [{ name: 'A-1 Pictures' }] },
        siteUrl: 'https://anilist.co/anime/176496',
      },
    },
    {
      id: 103,
      episode: 7,
      airingAt: now + 3600 * 22,
      timeUntilAiring: 3600 * 22,
      media: {
        id: 3,
        title: {
          romaji: 'Dandadan',
          english: 'DAN DA DAN',
        },
        coverImage: {
          large: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
          extraLarge: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
          color: '#ec4899',
        },
        genres: ['Action', 'Comedy', 'Supernatural'],
        averageScore: 87,
        popularity: 165000,
        format: 'TV',
        description: 'Momo Ayase strikes up an unusual friendship with her school\'s UFO fanatic, whom she nicknames "Okarun" because he shares a name with Ken Takakura. While Momo believes in ghosts, she brushes off aliens; Okarun believes in aliens but denies ghosts. To determine who is right, the two set off on a wager.',
        studios: { nodes: [{ name: 'Science SARU' }] },
        siteUrl: 'https://anilist.co/anime/171018',
      },
    },
  ];
}
