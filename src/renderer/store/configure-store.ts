import { createStore, applyMiddleware, compose, Middleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware as createRouterMiddleware } from 'connected-react-router';
import { createLogger } from 'redux-logger';
import { RootState } from '@types';

import { createRootReducer } from './reducers';
import { savePersistedGroups } from '../groups-ipc';

const loggerMiddleware = createLogger({
  level: 'info',
  collapsed: true,
});

/**
 * Persist groups to disk (via the main process) whenever a save completes.
 * Side effect lives here, not in the reducer — reducers must stay pure.
 */
const groupsPersistMiddleware: Middleware = ({ getState }) => next => action => {
  const result = next(action);

  if (action.type === '@@groups/saveGroups') {
    const { groups, championGroups } = (getState() as RootState).groups;
    savePersistedGroups({ groups, championGroups });
  }

  return result;
};

export const history = createHashHistory();

const routerMiddleware = createRouterMiddleware(history);

const enhancer = compose(
  applyMiddleware(
    routerMiddleware as any,
    thunkMiddleware as any,
    groupsPersistMiddleware,
    loggerMiddleware as any
  )
);

export default function configureStore(initialState: Partial<RootState>) {
  const rootReducer = createRootReducer(history);

  const store = createStore(rootReducer, initialState, enhancer);

  return store;
}
