import { ipcRenderer } from 'electron';

import configureStore, { history } from './configure-store';
import * as lcu from '@lcu/actions';
import * as groups from '@groups/actions';

// Hydrate persisted groups from the main process synchronously so the redux
// initialState has them before the first render.
(window as any).__persistedGroups =
  (window as any).__persistedGroups || ipcRenderer.sendSync('groups-hydrate');

const store = configureStore({});

// Seed the groups reducer from the hydrated data — without this the initial
// state is empty and the first save would wipe all persisted groups.
store.dispatch(groups.loadGroups());

ipcRenderer.on('lcu-sync', (evt: any, state: LCUState) => {
  store.dispatch(lcu.up(state));
});

ipcRenderer.on('lcu-disconnect', () => {
  store.dispatch(lcu.down());
});

ipcRenderer.on(
  'lcu-default-input-settings',
  (evt: any, settings: InputSettings) => {
    store.dispatch(groups.updateDefaultGroup(settings));
  }
);

ipcRenderer.on('lcu-input-settings', () => {
  store.dispatch(groups.loadGroups());
});

ipcRenderer.send('lcu-hydrate');

export { history };

export default store;
