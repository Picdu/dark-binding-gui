import React, { FC, memo, Fragment } from 'react';

const styles = require('./index.scss');

interface Action {
  text: string;
  disabled?: boolean;
  onClick: () => any;
}

interface ActionsProps {
  actions: Action[];
  children?: React.ReactNode;
}

export const Actions: FC<ActionsProps> = memo(({ actions, children }) => (
  <div className={styles.actions}>
    {children && <div className={styles.children}>{children}</div>}
    <div className={styles.buttons}>
      {actions.map(action => (
        <button
          key={action.text}
          className={styles.button}
          disabled={action.disabled}
          onClick={action.onClick}
        >
          {action.text}
        </button>
      ))}
    </div>
  </div>
));
