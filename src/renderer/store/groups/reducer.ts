import { get, set, cloneDeep, mapValues } from 'lodash';

import { createReducer } from '@utils/create-reducer';
import { updateInputSettings } from '@utils/parse-binding';

import * as actions from './actions';

// The store is created with the persisted groups as initialState (fetched
// from the main process in store/index.ts); these are safe empty fallbacks.
const initialState: GroupsState = {
  hasChanges: false,
  championGroups: {},
  groups: {},
};

// Last state known to be persisted to disk (via groups-save IPC). The Reset
// button re-seeds from this, discarding unsaved changes.
let savedSnapshot: Pick<GroupsState, 'groups' | 'championGroups'> =
  initialState;

export default createReducer(initialState, actions)({
  // Re-seed from an explicit payload (boot + post-game re-sync) or from the
  // last saved snapshot (Reset button).
  loadGroups: (state, payload?: Pick<GroupsState, 'groups' | 'championGroups'>) => {
    if (payload) savedSnapshot = payload;

    return {
      ...state,
      championGroups: payload?.championGroups ?? savedSnapshot.championGroups,
      groups: payload?.groups ?? savedSnapshot.groups,
      hasChanges: false,
    };
  },
  saveGroups: state => {
    savedSnapshot = {
      groups: state.groups,
      championGroups: state.championGroups,
    };

    return { ...state, hasChanges: false };
  },
  addGroup: (state, { name, group = cloneDeep(state.groups.default) }) => ({
    ...state,
    hasChanges: true,
    groups: { ...state.groups, [name]: group },
  }),
  renameGroup: (state, { oldName, nextName }) => {
    const championGroups = mapValues(state.championGroups, assignedGroup =>
      assignedGroup === oldName ? nextName : assignedGroup
    );

    const groups = { ...state.groups };

    groups[nextName] = groups[oldName];

    delete groups[oldName];

    return {
      ...state,
      groups,
      championGroups,
    };
  },
  deleteGroup: (state, name) => {
    const championGroups = mapValues(state.championGroups, assignedGroup =>
      assignedGroup === name ? 'default' : assignedGroup
    );

    delete state.groups[name];

    return {
      ...state,
      championGroups,
      groups: { ...state.groups },
    };
  },
  assignChampion: (state, { championId, group }) => {
    if (
      (!state.championGroups[championId] ||
        state.championGroups[championId] === 'default') &&
      group === 'default'
    ) {
      return state;
    }

    const championGroups = { ...state.championGroups };

    if (championGroups[championId] === group) {
      delete championGroups[championId];
    } else {
      championGroups[championId] = group;
    }

    return {
      ...state,
      hasChanges: true,
      championGroups,
    };
  },
  updateDefaultGroup: (state, defaultGroup) => ({
    ...state,
    groups: {
      ...state.groups,
      default: defaultGroup,
    },
  }),
  changeBinding: (state, { groupName, path, value, allowDuplicates }) => {
    const groups = state.groups;
    const group = groups[groupName];

    updateInputSettings(group, path, value, allowDuplicates);

    groups[groupName] = { ...group };

    return {
      ...state,
      hasChanges: true,
      groups,
    };
  },
  changeQuickcast: (state, { groupName, dataKey }) => {
    const groups = state.groups;
    const group = groups[groupName];

    set(
      group,
      ['Quickbinds', dataKey + 'smart'],
      !get(group, ['Quickbinds', dataKey + 'smart'])
    );

    groups[groupName] = { ...group };

    return {
      ...state,
      hasChanges: true,
      groups,
    };
  },
});
