import { protocol, app } from 'electron';
import { Readable } from 'stream';
import { request as httpsRequest } from 'https';
import { monitor } from './ws';
import logger from 'electron-log';

// Scheme must be registered as privileged before app ready (modern Electron
// replacement for the renderer-side webFrame.registerURLSchemeAsPrivileged).
protocol.registerSchemesAsPrivileged([
  { scheme: 'lcu', privileges: { stream: true, supportFetchAPI: true } },
]);

// Serve lcu:// URLs to the renderer by proxying them to the LCU HTTPS API
// with proper Basic auth. Uses node's https (rejectUnauthorized: false)
// because the LCU presents Riot's self-signed certificate, which
// Electron's net.fetch rejects with ERR_CERT_AUTHORITY_INVALID.

const requestLcu = (target: URL, method: string, headers: Headers) =>
  new Promise<{ status: number; contentType: string; body: Buffer }>(
    (resolve, reject) => {
      const req = httpsRequest(
        {
          hostname: target.hostname,
          port: target.port,
          path: target.pathname + target.search,
          method,
          rejectUnauthorized: false,
          headers: Object.fromEntries(headers.entries()),
        },
        res => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () =>
            resolve({
              status: res.statusCode || 502,
              contentType: res.headers['content-type'] || 'application/octet-stream',
              body: Buffer.concat(chunks),
            })
          );
        }
      );
      req.on('error', reject);
      req.end();
    }
  );

app.on('ready', () => {
  protocol.handle('lcu', async (request: Request): Promise<Response> => {
    if (!monitor.lockfile) {
      return new Response('LCU not connected', { status: 503 });
    }

    const { port, password } = monitor.lockfile;

    // request.url looks like lcu:///lol-game-data/assets/...
    const path = request.url.slice('lcu://'.length);

    const target = new URL(`https://127.0.0.1:${port}${path}`);

    try {
      const headers = new Headers(request.headers);
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`riot:${password}`).toString('base64')}`
      );

      const { status, contentType, body } = await requestLcu(
        target,
        request.method,
        headers
      );

      return new Response(
        Readable.toWeb(Readable.from(body)) as unknown as ReadableStream,
        {
          status,
          headers: { 'Content-Type': contentType },
        }
      );
    } catch (e) {
      logger.error('lcu:// proxy error', e);
      return new Response('LCU proxy error', { status: 502 });
    }
  });
});
