import {
  app,
  Tray,
  Menu,
  Notification,
  nativeImage,
  NotificationConstructorOptions,
} from 'electron';
import AutoLauncher from 'auto-launch';
import { platform } from 'os';
import { join } from 'path';
import { showMainWindow } from './main-window';
import logger from 'electron-log';

const isWin = platform() === 'win32';

// __static was an electron-webpack define; with Vite we resolve the icon
// relative to the app root ourselves.
const icon = nativeImage.createFromPath(
  app.isPackaged
    ? join(process.resourcesPath!, 'icons/dark-binding.png')
    : join(app.getAppPath(), 'static/icons/dark-binding.png')
);

const launcher = new AutoLauncher({ name: 'Dark Binding' });

export let tray: Tray | undefined;

const contextMenu = Menu.buildFromTemplate([
  {
    label: 'Open',
    type: 'normal',
    click: () => showMainWindow(),
  },
  {
    label: 'Run on system startup',
    type: 'checkbox',
    checked: true,
    click: handleRunOnStartClick,
  },
  { label: 'Exit', type: 'normal', click: () => app.quit() },
]);

// Tray (and Notification) may only be created after app is ready.
app.on('ready', () => {
  tray = new Tray(icon);
  tray.setToolTip('Manage your League of Legends keybindings');
  tray.setContextMenu(contextMenu);

  launcher.isEnabled().then(isEnabled => {
    logger.debug(`current run on startup status: ${isEnabled}`);

    contextMenu.items[1].checked = isEnabled;
    tray!.setContextMenu(contextMenu);
  });
});

app.on('window-all-closed', () => {
  showNotification({
    title: 'Window closed',
    body: 'Dark Binding is still running in the background',
  });
});

export function showNotification(options: NotificationConstructorOptions) {
  new Notification({
    silent: true,
    icon: isWin ? icon : undefined,
    ...options,
  }).show();
}

async function handleRunOnStartClick() {
  const status = contextMenu.items[1].checked;

  logger.debug(`Changing run on startup status to ${status}`);

  if (!status) await launcher.disable();
  if (status) await launcher.enable();
}
