import { type Plugin } from 'vite';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function radioMetadataPlugin(): Plugin {
  const cache: Record<string, { data: any; expiry: number }> = {};

  const STATION_MAP: Record<string, { host: string; path: string }> = {
    'jpop-powerplay': { host: 'kathy.torontocast.com', path: '/powerplay' },
    'asia-dream-japan': { host: 'quincy.torontocast.com', path: '/JapanHits' },
    'fm-setagaya': { host: 'fmsetagaya834.out.airtime.pro', path: '/fmsetagaya834_a' },
    'gensokyo-radio-1': { host: 'stream.gensokyoradio.net', path: '/1/' },
    'gensokyo-radio-3': { host: 'stream.gensokyoradio.net', path: '/3/' },
  };

  return {
    name: 'vite-plugin-radio-metadata',
    configureServer(server) {
      server.middlewares.use('/api/nowplaying', (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const stationId = url.searchParams.get('station') || 'jpop-powerplay';
        const target = STATION_MAP[stationId];

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (!target) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Unknown station id' }));
          return;
        }

        // Return cached entry if valid (15s TTL)
        const cached = cache[stationId];
        const now = Date.now();
        if (cached && cached.expiry > now) {
          res.statusCode = 200;
          res.end(JSON.stringify(cached.data));
          return;
        }

        // Fetch in-stream ICY metadata
        const options = {
          hostname: target.host,
          path: target.path,
          headers: {
            'Icy-MetaData': '1',
            'User-Agent': 'OtakuGMT-Dev/1.0',
          },
        };

        const clientReq = https.get(options, (streamRes: IncomingMessage) => {
          const metaint = parseInt((streamRes.headers['icy-metaint'] as string) || '0', 10);
          const icyName = (streamRes.headers['icy-name'] as string) || stationId;

          if (!metaint) {
            const fallback = {
              stationId,
              title: icyName,
              artist: stationId,
              fullTitle: icyName,
            };
            cache[stationId] = { data: fallback, expiry: now + 15000 };
            res.statusCode = 200;
            res.end(JSON.stringify(fallback));
            streamRes.destroy();
            return;
          }

          const chunks: Buffer[] = [];
          let total = 0;

          streamRes.on('data', (chunk: Buffer) => {
            chunks.push(chunk);
            total += chunk.length;

            if (total > metaint + 1024) {
              const fullBuffer = Buffer.concat(chunks);
              const metaLength = fullBuffer[metaint] * 16;
              let songTitle = '';

              if (metaLength > 0 && fullBuffer.length >= metaint + 1 + metaLength) {
                const metaString = fullBuffer.slice(metaint + 1, metaint + 1 + metaLength).toString('utf8');
                const match = metaString.match(/StreamTitle='(.*?)';/);
                if (match && match[1]) {
                  songTitle = match[1].trim();
                }
              }

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
                updatedAt: new Date().toISOString(),
              };

              cache[stationId] = { data: payload, expiry: now + 15000 };
              res.statusCode = 200;
              res.end(JSON.stringify(payload));
              streamRes.destroy();
            }
          });

          streamRes.on('error', () => {
            res.statusCode = 200;
            res.end(JSON.stringify({ stationId, artist: stationId, title: 'Live Broadcast' }));
          });
        });

        clientReq.on('error', () => {
          res.statusCode = 200;
          res.end(JSON.stringify({ stationId, artist: stationId, title: 'Live Broadcast' }));
        });

        clientReq.setTimeout(4000, () => {
          clientReq.destroy();
          res.statusCode = 200;
          res.end(JSON.stringify({ stationId, artist: stationId, title: 'Live Broadcast' }));
        });
      });
    },
  };
}
