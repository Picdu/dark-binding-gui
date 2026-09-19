import { protocol, app, net } from 'electron';
import { Readable } from 'stream';
import { Writable } from 'stream';
import { ClientRequest, RequestOptions, request as httpRequest } from 'http';
import { URL } from 'url';
import { monitor } from './ws';
import logger from 'electron-log';

// Serve lcu:// URLs to the renderer by proxying them to the LCU HTTPS API
// with proper Basic auth (URL-embedded credentials are no longer reliable).

function toWebReadable(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err: Error) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  }) as unknown as ReadableStream;
}

app.on('ready', () => {
  protocol.handle('lcu', async (request: Request): Promise<Response> => {
    if (!monitor.lockfile) {
      return new Response('LCU not connected', { status: 503 });
    }

    const { port, password } = monitor.lockfile;

    // request.url looks like lcu:///lol-game-data/assets/...
    const path = request.url.slice('lcu://'.length);

    const target = `https://127.0.0.1:${port}${path}`;

    try {
      const headers = new Headers(request.headers);
      headers.set(
        'Authorization',
        `Basic ${Buffer.from(`riot:${password}`).toString('base64')}`
      );

      const response = await net.fetch(target, {
        method: request.method,
        headers,
        body: request.body,
      });

      return response;
    } catch (e) {
      logger.error('lcu:// proxy error', e);
      return new Response('LCU proxy error', { status: 502 });
    }
  });
});
