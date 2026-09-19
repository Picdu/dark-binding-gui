import { app, dialog } from 'electron';
import logger from 'electron-log';
import * as fs from 'fs-extra';
import { join } from 'path';

import store from '@utils/store';
import * as api from '@utils/lcu/api';

import { monitor } from './lcu-toolkit';
import { showNotification } from './notifications';
import { firstTimeSetup } from './first-time-setup';
import { broadcast } from './utils';

const replaceConfig = async (group: string) => {
  const settings = store.get(`groups.${group}`) as InputSettings;
  logger.debug(`patching settings from group ${group}`, settings);

  if (!settings)
    return dialog.showErrorBox(
      'Dark Binding',
      `Could not find a group named ${group}`
    );

  const lockPath = join(app.getPath('userData'), 'lock');

  try {
    const lock = await fs.readFile(lockPath, 'utf8').catch(() => null);

    if (lock !== group) {
      logger.silly(
        'input settings patched',
        await api.inputSettings.patch(settings)
      );

      // Explicitly persist to disk so the patched bindings survive a
      // client crash (older patches auto-saved on exit, newer ones may
      // not).
      await api.inputSettings.save().catch(e => {
        logger.warn('explicit input-settings save failed', e);
      });

      showNotification({
        title: 'Bindings Applied',
        body: `Switched bindings to ${group}`,
      });

      await fs.writeFile(lockPath, group, 'utf8');
    }
  } catch (e) {
    logger.error(e);
    dialog.showErrorBox('Dark Binding', `Could not apply group ${group}`);
  }
};

const restoreConfig = async (
  config = store.get('groups.default') as InputSettings
) => {
  logger.debug('restoring settings');
  const lockPath = join(app.getPath('userData'), 'lock');

  try {
    const isLocked = await fs.pathExists(lockPath);
    if (isLocked) {
      const group = await fs.readFile(lockPath, 'utf8');
      const nextSettings = (await api.inputSettings.get()) as InputSettings;

      logger.debug(`syncing settings for group ${group}`, nextSettings);

      store.set(`groups.${group}`, nextSettings);
      broadcast('lcu-input-settings');

      try {
        await api.inputSettings.patch(config);

        showNotification({
          title: 'Bindings Restored',
          body:
            'Your bindings have been restored. Changes made during the game have been applied',
        });
      } catch (e) {
        dialog.showErrorBox(
          'Dark Binding',
          'Error restoring settings to default'
        );
      }
    }
  } catch (e) {
    showNotification({
      title: 'Error',
      body: 'Could not synchronize settings changed during the game',
    });
  } finally {
    fs.unlink(lockPath);
  }
};

monitor.on('login', ({ settings, inputMode }) => {
  if (inputMode === 'unsupported') {
    logger.warn(
      'Input system changed on this client - binding auto-switch disabled'
    );

    dialog.showErrorBox(
      'Dark Binding',
      "Riot changed the input system on this League patch.\n\n" +
        'Binding auto-switch is disabled until Dark Binding is updated ' +
        'for the new format. Everything else works.'
    );
  }

  if (settings) firstTimeSetup(settings);

  logger.debug('Binding Manager started');

  showNotification({
    title: 'Ready',
    body: 'You can now go into champion select!',
  });
});

monitor.on('champSelect', async data => {
  if (data.timer.phase !== 'FINALIZATION') return;

  logger.silly('received champion select packet');

  const self = data.myTeam.find(
    player => +player.summonerId === +monitor.state.summoner!
  )!;

  if (!self || !self.championId) return;

  const groupName = store.get('championGroups')[self.championId] || 'default';

  await replaceConfig(groupName);
});

monitor.on('gameFlow', status => {
  if (status === 'WaitingForStats' || status === 'TerminatedInError') {
    setTimeout(() => restoreConfig(), 5000);
  }
});
