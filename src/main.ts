import { app, ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import minimist from 'minimist';
import started from 'electron-squirrel-startup';
import { isDev } from '@utils/env';

import './main/lcu-toolkit';
import { checkForUpdates } from './main/auto-update';
import './main/binding-manager';
import { getMainWindow } from './main/main-window';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

log.transports.file.level = 'debug';
log.transports.console.level = isDev
  ? 'silly'
  : minimist(process.argv.slice(2)).loglevel || false;

app.setAppUserModelId('com.jinx.binding');

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

ipcMain.on('window-close', ({ sender }) => {
  BrowserWindow.fromWebContents(sender)?.close();
});

ipcMain.on('window-minimize', ({ sender }) => {
  BrowserWindow.fromWebContents(sender)?.minimize();
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  getMainWindow();

  if (!isDev) {
    checkForUpdates();
  }
});
