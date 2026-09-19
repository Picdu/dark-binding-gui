/**
 * Global type declarations for the renderer's persisted-groups hydration
 * window (set in store/index.ts from the main process).
 */
interface Window {
  __persistedGroups: {
    groups: Record<string, BindingGroup>;
    championGroups: Record<string | number, string>;
  };
}
