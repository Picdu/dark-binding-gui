/**
 * Persistence bridge: the renderer's redux state owns the group data; the
 * main process owns disk persistence (electron-store lives there — the
 * renderer must not pull node builtins into its browser bundle).
 *
 * Renderer -> main:
 *   groups-save  (payload: { groups, championGroups })  on every save
 *   groups-hydrate (sync) -> returns { groups, championGroups }
 */
import { ipcMain } from 'electron';

import store from '@utils/store';

export const initGroupsBridge = () => {
  ipcMain.on(
    'groups-save',
    (_evt, payload: { groups: unknown; championGroups: unknown }) => {
      store.set('groups', payload.groups);
      store.set('championGroups', payload.championGroups);
    }
  );

  // Synchronous hydrate: the renderer's redux initialState is computed at
  // module-eval time, before any async IPC could answer.
  ipcMain.on('groups-hydrate', event => {
    (event as any).returnValue = {
      groups: store.get('groups', {}),
      championGroups: store.get('championGroups', {}),
    };
  });
};
