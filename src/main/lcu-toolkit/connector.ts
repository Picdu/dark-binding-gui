import { app, dialog } from 'electron';
import logger from 'electron-log';
import { EventEmitter } from 'events';
import { join } from 'path';
import { readFile } from 'fs-extra';

import { sleep } from '@utils/sleep';

import * as api from '@utils/lcu/api';

const LOCKFILE_NAME = 'lockfile';

const INSTALL_DIR_CANDIDATES = [
  'C:\\Riot Games\\League of Legends',
  'C:\\Riot Games\\League of Legends_Game',
  'D:\\Riot Games\\League of Legends',
  'D:\\Riot Games\\League of Legends_Game',
  'E:\\Riot Games\\League of Legends',
  'E:\\Riot Games\\League of Legends_Game',
];

/**
 * Find the League install dir by probing common locations for the lockfile.
 * Can be overridden with the LEAGUE_CLIENT_DIR env var.
 */
async function findInstallDir(): Promise<string | null> {
  const candidates = [
    process.env.LEAGUE_CLIENT_DIR,
    ...INSTALL_DIR_CANDIDATES,
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      await readFile(join(dir, LOCKFILE_NAME), 'utf8');
      return dir;
    } catch {
      // lockfile not here, try next candidate
    }
  }

  return null;
}

/**
 * Parse the LCU lockfile format: LeagueClient:<pid>:<port>:<password>:https
 */
function parseLockfile(content: string): Credentials {
  const parts = content.split(':');
  const name = parts[0];
  const port = +parts[2];
  const password = parts[3];
  const protocol = parts[4] || 'https';

  if (name !== 'LeagueClient') {
    throw new Error(`Unexpected lockfile name "${name}"`);
  }

  return { port, password, protocol };
}

export class Connector extends EventEmitter {
  public lockfile?: Credentials;
  private _dirPath: string | null = null;
  private _running = false;
  private _loggedIn = false;

  constructor() {
    super();
  }

  public start() {
    if (this._running) return;

    this._running = true;
    logger.debug('Starting LCU lockfile poller');
    this._poll();
  }

  private async _poll() {
    while (this._running) {
      try {
        if (!this.lockfile) {
          const dir = await findInstallDir();

          if (dir) {
            const content = await readFile(join(dir, LOCKFILE_NAME), 'utf8');

            this.lockfile = parseLockfile(content);
            this._dirPath = dir;
            this._loggedIn = false;
            logger.debug('LCU lockfile found');

            this.emit('connect', this.lockfile);
          }
        } else {
          try {
            await readFile(join(this._dirPath!, LOCKFILE_NAME), 'utf8');
          } catch {
            logger.debug('LCU lockfile gone, disconnecting');
            this.lockfile = undefined;
            this._dirPath = null;
            this._loggedIn = false;
            this.emit('disconnect');
          }

          if (this.lockfile && !this._loggedIn) {
            this._loggedIn = true;
            await this.pollLogin();
          }
        }
      } catch (e) {
        logger.error(e);
      }

      await sleep(2000);
    }
  }

  protected async pollLogin() {
    if (!this.lockfile) return;
    logger.debug('Polling LCU summoner');

    try {
      const summoner = await api.summoner.currentSummoner();
      logger.debug('Found LCU summoner', summoner);

      this.pollSettings(+summoner.summonerId);
    } catch (e) {
      logger.error(e);
      this._loggedIn = false;
      await sleep(5000);
      this.pollLogin();
    }
  }

  protected async pollSettings(summonerId: number) {
    if (!this.lockfile) return;
    logger.debug('Polling LCU input settings');

    let settings: InputSettings;

    try {
      settings = await api.inputSettings.get();
      logger.debug('Found LCU input settings (v1)');
    } catch (e: any) {
      const status = e?.response?.status;

      // Riot removed/re-routed the v1 endpoint (e.g. the 2026 Input
      // Update). Degrade gracefully instead of retrying forever: log in
      // anyway, but flag the input system as unsupported.
      if (status === 404 || status === 405 || status === 501) {
        logger.warn(
          'input-settings endpoint unavailable (HTTP', status,
          "), entering degraded mode - Riot's input system has changed"
        );

        const champions = await api.champions
          .get(summonerId)
          .catch(() => []);
        const gameFlow = await api.gameFlow.phase().catch(() => 'None');

        this.emit('login', {
          summoner: summonerId,
          settings: undefined,
          champions,
          gameFlow,
          inputMode: 'unsupported' as const,
        });
        return;
      }

      logger.error(e);
      this._loggedIn = false;
      await sleep(5000);
      this.pollLogin();
      return;
    }

    try {
      const champions = await api.champions.get(summonerId);
      logger.debug('Found LCU champions list');
      const gameFlow = await api.gameFlow.phase();

      this.emit('login', {
        summoner: summonerId,
        settings,
        champions,
        gameFlow,
        inputMode: 'v1' as const,
      });
    } catch (e) {
      logger.error(e);
      this._loggedIn = false;
      await sleep(5000);
      this.pollLogin();
    }
  }
}
