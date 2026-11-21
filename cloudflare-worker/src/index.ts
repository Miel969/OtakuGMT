/**
 * Cloudflare Worker: OtakuGMT Live Radio Song Metadata Extractor
 * Extracts in-stream ICY "StreamTitle" metadata with 15-second Edge Caching.
 * Zero audio streaming pass-through — minimal CPU and zero risk of quota exhaustion.
 */

export interface Env {
  // Optional Cloudflare bindings if needed in future
}

// Map of station identifiers to their underlying direct Icecast/Shoutcast stream mounts
const STATION_STREAM_MAP: Record<string, string> = {
  'jpop-powerplay': 'https://kathy.torontocast.com/powerplay',
  'asia-dream-japan': 'https://quincy.torontocast.com/JapanHits',
  'fm-setagaya': 'https://fmsetagaya834.out.airtime.pro/fmsetagaya834_a',
  'gensokyo-radio-1': 'https://stream.gensokyoradio.net/1/',
  'gensokyo-radio-3': 'https://stream.gensokyoradio.net/3/',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const stationId = url.searchParams.get('station') || 'jpop-powerplay';
    const streamUrl = STATION_STREAM_MAP[stationId];

    if (!streamUrl) {
      return new Response(JSON.stringify({ error: 'Unknown station id' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Check Cloudflare Edge Cache API first (15-second TTL per station)
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;
    let response = await cache.match(cacheKey);

    if (response) {
      return response;
    }

    try {
      // Connect to the stream asking for in-band ICY metadata
      const streamRes = await fetch(streamUrl, {
        headers: {
          'Icy-MetaData': '1',
          'User-Agent': 'OtakuGMT-Worker/1.0',
        },
      });

      const metaintHeader = streamRes.headers.get('icy-metaint');
      const icyName = streamRes.headers.get('icy-name') || stationId;
      const icyGenre = streamRes.headers.get('icy-genre') || '';

      let songTitle = '';

      if (metaintHeader && streamRes.body) {
        const metaint = parseInt(metaintHeader, 10);
        const reader = streamRes.body.getReader();
        let bytesAccumulated = 0;
        let metadataLength = 0;
        let rawBuffer = new Uint8Array(0);

        // Read just enough chunks to pass the first audio block and read the metadata string
        while (true) {
          const { done, value } = await reader.read();
          if (done || !value) break;

          const newBuffer = new Uint8Array(rawBuffer.length + value.length);
          newBuffer.set(rawBuffer);
          newBuffer.set(value, rawBuffer.length);
          rawBuffer = newBuffer;
          bytesAccumulated = rawBuffer.length;

          // Check if we reached the metadata position
          if (bytesAccumulated > metaint) {
            metadataLength = rawBuffer[metaint] * 16;
            if (metadataLength > 0 && bytesAccumulated >= metaint + 1 + metadataLength) {
              const metaSlice = rawBuffer.slice(metaint + 1, metaint + 1 + metadataLength);
              const metaText = new TextDecoder('utf-8').decode(metaSlice);
              const match = metaText.match(/StreamTitle='(.*?)';/);
              if (match && match[1]) {
                songTitle = match[1].trim();
              }
              break;
            } else if (metadataLength === 0) {
              break;
            }
          }

          // Safety guard: cancel reading after ~64KB so we never hold stream open
          if (bytesAccumulated > 65536) {
            break;
          }
        }

        // Cancel connection immediately after extracting the title
        await reader.cancel();
      }

      // Format response: split "Artist - Title" if present
      let artist = icyName;
      let title = songTitle || icyName;

      if (songTitle.includes(' - ')) {
        const parts = songTitle.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const payload = {
        stationId,
        artist,
        title,
        fullTitle: songTitle || `${artist} - ${title}`,
        genre: icyGenre,
        updatedAt: new Date().toISOString(),
      };

      response = new Response(JSON.stringify(payload), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          // Cache on Cloudflare Edge for 15 seconds, client for 10 seconds
          'Cache-Control': 'public, max-age=10, s-maxage=15',
        },
      });

      // Put response into Cloudflare Edge Cache
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          stationId,
          artist: stationId,
          title: 'Live Broadcast',
          error: err.message || 'Stream metadata unreachable',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=5',
          },
        }
      );
    }
  },
};
