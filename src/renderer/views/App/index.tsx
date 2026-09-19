import React, { FC, Fragment } from 'react';
import { connect } from 'react-redux';
import { RootState } from '@types';

import { lcuStatus } from '@lcu/selectors';

import styles from './index.module.scss';

interface AppProps {
  updateProgress?: number;
  lcuStatus: ReturnType<typeof lcuStatus>;
  inputMode?: InputMode;
  children?: React.ReactNode;
}

const App: FC<AppProps> = ({
  lcuStatus,
  updateProgress,
  inputMode,
  children,
}) => {
  if (updateProgress) {
    return (
      <div className={styles.app}>
        <h1>Updating {+updateProgress.toFixed(0)}%</h1>
      </div>
    );
  }

  if (lcuStatus === 'loggedIn') {
    return (
      <Fragment>
        {inputMode === 'unsupported' && (
          <div style={{
            padding: '8px 16px',
            background: '#c8aa6e',
            color: '#091428',
            fontWeight: 'bold',
          }}>
            Riot changed the input system - binding auto-switch is disabled
            until Dark Binding is updated.
          </div>
        )}
        {children}
      </Fragment>
    );
  }

  return (
    <div className={styles.app}>
      {lcuStatus === 'closed' && <h1>Waiting for the League Client...</h1>}
      {lcuStatus === 'loggedOut' && (
        <h1>Login on the League Client to start managing your keybindings</h1>
      )}
      {lcuStatus === 'inGame' && <h1>Waiting for your game to finish</h1>}
    </div>
  );
};

export default connect((state: RootState) => ({
  lcuStatus: lcuStatus(state),
  updateProgress: state.lcu.updateProgress,
  inputMode: state.lcu.inputMode,
}))(App);
