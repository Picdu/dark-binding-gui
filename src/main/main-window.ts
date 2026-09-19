import { BrowserWindow } from 'electron';
import * as path from 'path';

import { getInitialWindowDimensions } from './window-scale';

// Injected as build-time defines by @electron-forge/plugin-vite
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | undefined;

export function getMainWindow() {
  if (mainWindow) return mainWindow;

  const { dimensions, scale } = getInitialWindowDimensions();

  const window = new BrowserWindow({
    show: false,
    width: dimensions.width,
    minWidth: 1024,
    height: dimensions.height,
    minHeight: 540,
    frame: false,
    resizable: false,
    fullscreenable: false,
    hasShadow: false,
    webPreferences: {
      zoomFactor: scale,
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Forge Vite dev server (injected as a build-time define)
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    // Production: renderer bundle from the Forge Vite plugin
    window.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  window.webContents.on('did-finish-load', () => {
    window.show();
  });

  window.on('closed', () => {
    mainWindow = undefined;
  });

  mainWindow = window;

  return window;
}

export const showMainWindow = () => {
  if (mainWindow) {
    mainWindow.show();
  }

  getMainWindow();
};
