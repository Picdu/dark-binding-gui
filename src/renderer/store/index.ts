import { ipcRenderer } from 'electron';

import configureStore, { history } from './configure-store';
import * as lcu from '@lcu/actions';
import * as groups from '@groups/actions';

const store = configureStore({});

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
