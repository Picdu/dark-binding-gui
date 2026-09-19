import React, { FC } from 'react';
import cx from 'classnames';

import style from './index.module.scss';

interface ButtonGroupProps {
  className?: string;
  children?: React.ReactNode;
}

export const ButtonGroup: FC<ButtonGroupProps> = ({ className, children }) => (
  <div className={cx(style.buttonGroup, className)}>
    <div className={style.content}>{children}</div>
  </div>
);
