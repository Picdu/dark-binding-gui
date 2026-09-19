import { dialog, BrowserWindow, shell } from 'electron';

import { isDev } from '@utils/env';
import { getMainWindow } from './main-window';

/**
 * There is no update server configured for this fork; point users at the
 * releases page instead of shipping a half-wired auto-updater.
 */
export function checkForUpdates() {
  if (isDev) {
    return;
  }

  const wnd: BrowserWindow = getMainWindow();

  dialog
    .showMessageBox(wnd, {
      title: 'Dark Binding',
      message:
        'Check the releases page for new versions of Dark Binding.',
      buttons: ['Open Releases Page', 'OK'],
      defaultId: 0,
    })
    .then(result => {
      if (result.response === 0) {
        shell.openExternal(
          'https://github.com/s-coimbra21/dark-binding-gui/releases'
        );
      }
    });
}
