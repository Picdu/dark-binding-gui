import { ipcRenderer } from 'electron';

/**
 * IPC surface for group persistence. The main process owns disk
 * persistence (see src/main/groups-bridge.ts); the renderer reads/writes
 * through these two calls only.
 */
export interface PersistedGroups {
  groups: Record<string, BindingGroup>;
  championGroups: Record<string | number, string>;
}

/** Fetch persisted groups synchronously (must run before first render). */
export const fetchPersistedGroups = (): PersistedGroups =>
  ipcRenderer.sendSync('groups-hydrate');

export const savePersistedGroups = (payload: PersistedGroups) =>
  ipcRenderer.send('groups-save', payload);
