import classNames from 'classnames/bind';
import React, { useEffect, useState } from 'react';
import styles from './SystemMessage.module.css';

export const SystemMessage = ({ data, ...props }) => {
  const cx = classNames.bind(styles);
  const { messageText, systemActivityType, isSameSpeakerAsPrevious } = data;
  const isDateMessage = systemActivityType === 'DATE_CHANGE';

  const dateMessage = () => {
    return (
      <div className={cx('dateContainer')}>
        <div className={cx('bar')} />
        <p className={cx('date')}>{messageText}</p>
        <div className={cx('bar')} />
      </div>
    );
  };

  const plainMessage = () => {
    return <p className={cx('systemMessage')}>{messageText}</p>;
  };

  return (
    <div className={cx('container', isSameSpeakerAsPrevious && 'continue')}>
      {isDateMessage ? dateMessage() : plainMessage()}
    </div>
  );
};
