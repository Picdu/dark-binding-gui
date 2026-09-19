import { sortBy } from 'lodash/fp';

import { get, patch, post } from './fetch';

import championsJson from '../../../../static/champions.json';

export const inputSettings = {
  // v1 is still the only keybind storage in the current client (swagger
  // 16.17.x confirms it). See docs/input-system-notes.md.
  get: get<InputSettings>('/lol-game-settings/v1/input-settings'),
  patch: patch<InputSettings, InputSettings>(
    '/lol-game-settings/v1/input-settings'
  ),
  // Explicitly persist settings to disk so a PATCH is not lost if the
  // client crashes or the input system changes behavior.
  save: () => post<void, boolean>('/lol-game-settings/v1/save')(undefined),
};

export const inputSettingsSchema = {
  get: get<InputSettings>('/lol-game-settings/v1/input-settings-schema'),
};

export const summoner = {
  // Just getting summonerId
  currentSummoner: get<{ summonerId: number }>(
    '/lol-summoner/v1/current-summoner'
  ),
};

export const champions = {
  get: (summonerId: number) =>
    get<Champions>(
      `/lol-champions/v1/inventories/${summonerId}/champions-minimal`
    )()
      .then(champions => champions.filter(c => c.id >= 0))
      .catch(() => championsJson.data)
      .then(sortBy(['name'])),
};

export const gameFlow = {
  // `get(...)` already returns a thunk that produces the request promise,
  // so `phase()` must be the thunk itself (not a wrapper returning it).
  phase: get<string>('/lol-gameflow/v1/gameflow-phase'),
};
