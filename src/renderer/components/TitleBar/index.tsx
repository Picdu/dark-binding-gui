import React, { FC, memo } from 'react';
import { ipcRenderer } from 'electron';
import cx from 'classnames';

import styles from './index.module.scss';

const close = () => ipcRenderer.send('window-close');
const minimize = () => ipcRenderer.send('window-minimize');

interface TitleBarProps {
  children?: React.ReactNode;
}

export const TitleBar: FC<TitleBarProps> = memo(({ children }) => (
  <div className={styles.app}>
    <div className={styles.titleBar}>
      <div className={styles.title}>
        <div className={styles.icon} />
        <h2>Dark Binding</h2>
      </div>
      <div>
        <button
          className={cx(styles.button, styles.minimize)}
          onClick={minimize}
        />
        <button className={cx(styles.button, styles.close)} onClick={close} />
      </div>
    </div>
    <div className={styles.content}>{children}</div>
  </div>
));
