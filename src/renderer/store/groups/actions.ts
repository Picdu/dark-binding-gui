import { Dispatch } from 'redux';
import { RootState } from '@types';
import { replace } from 'connected-react-router';

// Minimal action creators (replaced typesafe-actions 3.x, which is ESM-only in v5).

export const addGroup = (payload: { group?: BindingGroup; name: string }) => ({
  type: '@@groups/addGroup' as const,
  payload,
});
(addGroup as any).getType = () => '@@groups/addGroup';

export const renameGroup = (payload: {
  oldName: string;
  nextName: string;
}) => ({
  type: '@@groups/renameGroup' as const,
  payload,
});
(renameGroup as any).getType = () => '@@groups/renameGroup';

export const deleteGroup = (payload: string) => ({
  type: '@@groups/deleteGroup' as const,
  payload,
});
(deleteGroup as any).getType = () => '@@groups/deleteGroup';

export const loadGroups = () => ({
  type: '@@groups/loadGroups' as const,
});
(loadGroups as any).getType = () => '@@groups/loadGroups';

export const saveGroups = () => ({
  type: '@@groups/saveGroups' as const,
});
(saveGroups as any).getType = () => '@@groups/saveGroups';

export const updateDefaultGroup = (payload: InputSettings) => ({
  type: '@@groups/updateDefaultGroup' as const,
  payload,
});
(updateDefaultGroup as any).getType = () => '@@groups/updateDefaultGroup';

export const assignChampion = (payload: {
  championId: number;
  group: string;
}) => ({
  type: '@@groups/assignChampion' as const,
  payload,
});
(assignChampion as any).getType = () => '@@groups/assignChampion';

export const discardChanges = (redirect?: string) => (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  if (getState().groups.hasChanges) {
    dispatch(loadGroups());
  }

  if (redirect) dispatch(replace(redirect));
};

const getFinalGroupName = (
  initialName: string,
  groups: Record<string, InputSettings>
) => {
  const sanitizedName = initialName.replace('.', '').trim();

  if (!sanitizedName || sanitizedName.toLowerCase() === 'default') return;

  let name = sanitizedName;
  let suffix = 0;

  while (groups[name]) {
    suffix++;
    name = sanitizedName + ` (${suffix})`;
  }

  return name;
};

export const changeName = (nextName: string, oldName?: string) => (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  if (!oldName || nextName === oldName) return;

  const { groups } = getState();

  const finalName = getFinalGroupName(nextName, groups.groups);

  if (!finalName) return;

  dispatch(renameGroup({ oldName, nextName: finalName }));
  dispatch(saveGroups());
};

export const removeGroup = (groupName: string) => (dispatch: Dispatch) => {
  dispatch(deleteGroup(groupName));
  dispatch(saveGroups());
};

export const createGroup = (groupName: string) => (
  dispatch: Dispatch,
  getState: () => RootState
) => {
  const { groups } = getState();
  const name = getFinalGroupName(groupName, groups.groups);

  if (!name) return;

  dispatch(addGroup({ name }));
  dispatch(saveGroups());
};

export const changeBinding = (
  groupName: string,
  path: string,
  value: Binding[],
  allowDuplicates = false
) => ({
  type: '@@groups/changeBinding' as const,
  payload: { groupName, path, value, allowDuplicates },
});
(changeBinding as any).getType = () => '@@groups/changeBinding';

export const changeQuickcast = (groupName: string, dataKey: string) => ({
  type: '@@groups/changeQuickcast' as const,
  payload: { groupName, dataKey },
});
(changeQuickcast as any).getType = () => '@@groups/changeQuickcast';
