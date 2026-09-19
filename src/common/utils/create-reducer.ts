import { Reducer, AnyAction } from 'redux';

/**
 * Minimal loose-typed reducer factory.
 * Action creators are plain functions returning {type, payload}
 * with a `.type` property attached.
 */
type Handler<S> = (state: S, payload: any, meta: any) => S;

export function createReducer<S>(
  initialState: S | undefined,
  actions: Record<string, any>
): (handlers: Record<string, Handler<S>>) => Reducer<S, AnyAction> {
  return handlers => {
    const actionTypes: Record<string, Handler<S>> = {};

    Object.keys(handlers).forEach(key => {
      const creator = actions[key];

      if (!creator) return;

      const type = typeof creator.getType === 'function' ? creator.getType() : creator.type;

      if (type) actionTypes[type] = handlers[key];
    });

    return (state: S | undefined = initialState, action: AnyAction) => {
      const handler = actionTypes[action.type];

      return handler ? handler(state, action.payload, action.meta) : state;
    };
  };
}
