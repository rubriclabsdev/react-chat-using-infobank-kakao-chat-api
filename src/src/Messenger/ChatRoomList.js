import classNames from 'classnames/bind';
import React, { useState } from 'react';
import { ChatRoomListItem } from './ChatRoomListItem';
import styles from './ChatRoomList.module.css';

export const ChatRoomList = ({ onItemClick, data, ...props }) => {
  const cx = classNames.bind(styles);

  return (
    <div className={cx('container')}>
      {data?.map((chatItemData) => (
        <ChatRoomListItem
          key={chatItemData.roomId}
          onItemClick={onItemClick}
          data={chatItemData}
        />
      ))}
    </div>
  );
};
