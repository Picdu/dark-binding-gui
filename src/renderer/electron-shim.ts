/**
 * Renderer shim for the electron built-in module.
 *
 * The renderer runs with nodeIntegration, so `require('electron')` works at
 * runtime — but Vite must not try to bundle the npm `electron` package
 * (it's a path-lookup shim that crashes in the browser bundle).
 */
const electron: any = require('electron');

export const ipcRenderer = electron.ipcRenderer;
export const webFrame = electron.webFrame;
export const clipboard = electron.clipboard;
export const shell = electron.shell;
export default electron;
