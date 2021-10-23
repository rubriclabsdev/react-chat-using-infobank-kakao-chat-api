import classNames from 'classnames/bind';
import React, { useEffect, useState, Fragment } from 'react';
import { ReactComponent as EmojiIcon } from '../../resources/images/emoji-icon.svg';
import styles from './UserMessage.module.css';

export const UserMessage = ({ data, ...props }) => {
  const {
    speaker,
    speakerName,
    messageText,
    messageType,
    errorMessage,
    isSameSpeakerAsPrevious,
    status,
    chatFile,
    messageDt,
  } = data;
  const isCustomer = speaker === 'CUSTOMER';
  const cx = classNames.bind(styles);

  const onFileClicked = () => {
    if (chatFile.fileUrl && chatFile.fileUrl !== '') {
      const ext = chatFile.fileUrl.split('.').pop().split(/\#|\?/)[0];
      window.open(
        chatFile.fileUrl,
        `${speakerName}_${messageDt.split('.')[0]}.${ext}`
      );
    }
  };

  const createContent = () => {
    const renderType = status === 'FAILED' ? status : messageType;
    // console.log("========================")
    // console.log(`message`,data);
    // console.log(`status ${status}`);
    // console.log(`chatFile.fileUrl ${chatFile?.fileUrl}`);

    switch (renderType) {
      case 'FAILED': {
        return <div className={cx('text')}>{errorMessage}</div>;
      }
      case 'TEXT': {
        return <div className={cx('text')}>{messageText}</div>;
      }
      case 'IMAGE': {
        return (
          <div onClick={onFileClicked}>
            <img className={cx('image')} src={chatFile.fileUrl} />
          </div>
        );
      }
      case 'AUDIO': {
        return (
          <div className={cx('file')} onClick={onFileClicked}>
            <a className={cx('text')}>오디오</a>
          </div>
        );
      }
      case 'VIDEO': {
        return (
          <div className={cx('file')} onClick={onFileClicked}>
            <a className={cx('text')}>비디오</a>
          </div>
        );
      }
      case 'FILE': {
        return (
          <div className={cx('file')} onClick={onFileClicked}>
            <a className={cx('text')}>파일</a>
          </div>
        );
      }
      case 'LINK': {
        return <div className={cx('text')}>{messageText}</div>;
      }
    }
  };

  const showSpeakerName = isCustomer && !isSameSpeakerAsPrevious;

  return (
    <div
      className={cx(
        'container',
        isCustomer ? 'customer' : 'user',
        isSameSpeakerAsPrevious && 'continue',
        status === 'PENDING' && 'pending'
      )}
    >
      {showSpeakerName ? <div className={cx('name')}>{speakerName}</div> : null}
      <div className={cx('message')}>
        {!isCustomer && (
          <p className={cx('subName')}>{`${speakerName} 답변`}</p>
        )}
        <div className={cx('content')}>{createContent()}</div>
      </div>
    </div>
  );
};
