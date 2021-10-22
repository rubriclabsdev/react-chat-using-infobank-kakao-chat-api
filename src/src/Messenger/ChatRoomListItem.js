import classNames from 'classnames/bind';
import React, { useState } from 'react';
import styles from './ChatRoomListItem.module.css';

export const ChatRoomListItem = ({ onItemClick, data, ...props }) => {
  const cx = classNames.bind(styles);

  const getToday = () => {
    const today = new Date();
    const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${
      today.getDate() > 9 ? today.getDate() : `0${today.getDate()}`
    }T00:00:00`;
    return new Date(todayString);
  };

  const getTimeString = (dateString) => {
    const today = getToday();
    const targetDate = new Date(`${dateString.split('T')[0]}T00:00:00`);
    const dateDiff = (today - targetDate) / (1000 * 3600 * 24);

    if (dateDiff < 1) {
      const dateStringToObj = new Date(dateString);
      return `${dateStringToObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (dateDiff < 2) {
      return `어제`;
    } else {
      return `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;
    }
  };

  return (
    <div
      className={cx('container')}
      onClick={() => {
        onItemClick(data);
      }}
    >
      <div className={cx('header')}>
        <p className={cx('name')}>{data.customerName}</p>
        <p className={cx('date')}>{getTimeString(data.latestChat.messageDt)}</p>
      </div>
      <div className={cx('content')}>
        <p className={cx('latestMessage')}>{data.latestChat.messageText}</p>
        {data.unansweredChats ? (
          <p className={cx('newMsgCount')}>답변대기</p>
        ) : null}
      </div>
    </div>
  );
};
