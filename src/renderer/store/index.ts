import { ipcRenderer } from 'electron';

import configureStore, { history } from './configure-store';
import { fetchPersistedGroups, savePersistedGroups } from '../groups-ipc';
import * as lcu from '@lcu/actions';
import * as groups from '@groups/actions';

// Fetch persisted groups from the main process synchronously so the redux
// initialState carries them before the first render.
const store = configureStore({
  groups: {
    hasChanges: false,
    ...fetchPersistedGroups(),
  },
});

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

// After a game the main process re-synced the played group on disk; reload
// it into the store from the freshly fetched disk state.
ipcRenderer.on('lcu-input-settings', () => {
  store.dispatch(groups.loadGroups(fetchPersistedGroups()));
});

ipcRenderer.send('lcu-hydrate');

export { history };

export default store;
