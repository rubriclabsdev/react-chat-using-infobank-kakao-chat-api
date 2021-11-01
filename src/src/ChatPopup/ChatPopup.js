import classNames from 'classnames/bind';
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  Fragment,
} from 'react';
import { ReactComponent as CloseIcon } from '../../resources/images/close-icon.svg';
import { ReactComponent as ImageIcon } from '../../resources/images/image-icon.svg';
import { ReactComponent as EmojiIcon } from '../../resources/images/emoji-icon.svg';
import { ReactComponent as Dots } from '../../resources/images/dotdotdot.svg';
import { ReactComponent as ToBottomICon } from '../../resources/images/to-bottom-icon.svg';
import styles from './ChatPopup.module.css';
import { SystemMessage } from './SystemMessage';
import { UserMessage } from './UserMessage';
import SockJsClient from 'react-stomp';
import { preventDoubleScroll, isScrollBottom } from '../utils/util';
import { debounce } from 'lodash';

export const ChatPopup = ({
  onClose,
  data,
  connectionHeaders,
  brandId,
  serverUrl,
  userId,
  ...props
}) => {
  const { roomId, customerName } = data;
  const cx = classNames.bind(styles);
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(22);
  const [messageList, setMessageList] = useState([]);
  const [scrollInitialized, setScrollInitialized] = useState(false);
  const [writingUserMessage, setWritingUserMessage] = useState('');
  const [newMessageBarChat, setNewMessageBarChat] = useState();
  const [showNewMessageBar, setShowNewMessageBar] = useState(false);
  const messageListRef = useRef([]);
  const contentContainer = useRef(null);
  const chatOffset = useRef(null);
  const socketClient = useRef({});
  const previousFirstChild = useRef(null);
  const textareaRef = useRef(null);
  const writingUserList = useRef([]);
  const [chatStatus, setChatStatus] = useState('UNINITIALIZED');
  const isWriting = useRef(false);

  const debounceStopWriting = useRef(
    debounce(() => {
      const roomActivity = {
        chatRoomId: roomId,
        writing: false,
      };
      socketClient.current.sendMessage(
        '/pub/room_activity',
        JSON.stringify(roomActivity)
      );
      isWriting.current = false;
      console.log('마지막으로 찍은 후 3초 지남!');
    }, 3000)
  ).current;

  const onInputChange = (e) => {
    const targetHeight = Math.min(e.target.scrollHeight, 126);
    setInputHeight(e.target.value === '' ? 22 : targetHeight);
    setInputValue(e.target.value);

    if (e.target.value !== '' && !isWriting.current) {
      const roomActivity = {
        chatRoomId: roomId,
        writing: true,
      };
      socketClient.current.sendMessage(
        '/pub/room_activity',
        JSON.stringify(roomActivity)
      );
    }
    debounceStopWriting();
  };

  const getPreviousMessageList = async () => {
    try {
      const response = await fetch(
        serverUrl +
          `/${brandId}/chat_room/${roomId}/chat_logs${
            chatOffset.current !== null ? `?offset=${chatOffset.current}` : ''
          }`,
        {
          method: 'GET',
          headers: connectionHeaders,
        }
      );
      const resJson = await response.json();

      const isResponseSuccess = response.status >= 200 && response.status < 400;
      if (isResponseSuccess) {
        let previousChat = null;
        let result = [...resJson.data.reverse(), ...messageListRef.current];

        result = result.map((chat) => {
          chat.isSameSpeakerAsPrevious =
            previousChat && previousChat.speaker === chat.speaker;
          previousChat = chat;
          return chat;
        });
        previousFirstChild.current = contentContainer.current.firstChild;

        setMessageList(result);
        messageListRef.current = result;
        chatOffset.current = resJson.nextOffset;
        // console.log(result);
      } else {
        console.log(resJson);
        throw new Error(response.status);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const createMessage = (chat) => {
    return chat.speaker === 'SYSTEM' ? (
      <SystemMessage data={chat} key={chat.id} />
    ) : (
      <UserMessage data={chat} key={chat.id} />
    );
  };

  const onNewChatComming = (message, channelName) => {
    // console.log('NEW MESSAGE!');
    // console.log(message);
    // console.log(channelName);

    if (channelName.includes('room_activity')) {
      const isMe = userId == message.id;

      if (!isMe) {
        // writing false 면 빼내
        // writing true 고 isMe 아니면 넣어
        // console.log(`not me!!!`);

        const targetIndex = writingUserList.current.findIndex(
          (u) => u.id === message.id
        );
        // console.log(`targetIndex  ${targetIndex}`);
        // console.log(`message.writing  ${message.writing}`);

        if (message.writing && targetIndex === -1) {
          writingUserList.current = [...writingUserList.current, message];
        } else if (!message.writing && targetIndex !== -1) {
          writingUserList.current.splice(targetIndex, 1);
        }
        // console.log(`newWritingUserList`);
        // console.log(writingUserList.current);

        if (writingUserList.current.length > 2) {
          setWritingUserMessage('여러명이 입력중입니다');
        } else if (writingUserList.current.length > 0) {
          let nameList = [];
          for (
            let i = 0;
            i < Math.min(2, writingUserList.current.length);
            i++
          ) {
            nameList.push(writingUserList.current[i].name);
          }
          setWritingUserMessage(`${nameList}님이 입력중입니다`);
        } else {
          setWritingUserMessage('');
        }
      }
    } else {
      const index = messageList.findIndex(
        (prevMsg) => prevMsg.id === message.id
      );

      if (index !== -1) {
        const newResult = [...messageList];
        newResult[index] = message;

        setMessageList(newResult);
        messageListRef.current = newResult;
      } else {
        const prevMessage = messageList.length
          ? messageList[messageList.length - 1]
          : null;
        message.isSameSpeakerAsPrevious =
          prevMessage && prevMessage.speaker === message.speaker;

        const newResult = [...messageList, message];
        setMessageList(newResult);
        messageListRef.current = newResult;
      }
    }

    setNewMessageBarChat(message);
  };

  const onMessageClicked = () => {
    // console.log("MESSAGE SEND CLICKED!!! ");
    if (inputValue === '') {
      return;
    }

    const message = {
      chatRoomId: roomId, // 채팅 룸 아이디
      messageText: inputValue, // 메시지 내용. 최대 1000자
      refKey: null, // 클라이언트 전달 참조 키
      botEvent: null, // 실행할 챗봇 이벤트
    };
    // console.log(message);
    // console.log(socketClient.current);
    socketClient.current.sendMessage('/pub/message', JSON.stringify(message));
    setInputValue('');
    setInputHeight(22);
  };

  const onImageSelected = async (e) => {
    try {
      const body = new FormData();
      body.append('file', e.target.files[0]);

      const response = await fetch(
        serverUrl + `/${brandId}/chat/${roomId}/file`,
        {
          method: 'POST',
          headers: connectionHeaders,
          body: body,
        }
      );
      const resJson = await response.json();

      const isResponseSuccess = response.status >= 200 && response.status < 400;
      if (isResponseSuccess) {
        console.log(resJson);
      } else {
        console.log(resJson);
        throw new Error(response.status);
      }
    } catch (e) {
      console.log(e);
    }
  };

  function onScroll(e) {
    if (e.target.scrollTop === 0 && chatOffset.current !== -1) {
      // console.log('NEED MORE!!!!!!!!')
      getPreviousMessageList();
    }

    // 스크롤 맨 아래에 닿았을 때 new message bar 보이던게 있으면 없애
    if (isScrollBottom(e.target)) {
      setShowNewMessageBar(false);
      setNewMessageBarChat(null);
    }
  }

  useEffect(() => {
    getPreviousMessageList();
    contentContainer.current.addEventListener('mousewheel', (event) =>
      preventDoubleScroll(event, contentContainer.current)
    );
    contentContainer.current.addEventListener('scroll', onScroll);
    return () => {
      contentContainer.current.removeEventListener('mousewheel', (event) =>
        preventDoubleScroll(event, contentContainer.current)
      );
      contentContainer.current.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    if (newMessageBarChat) {
      const scrollableArea =
        contentContainer.current.scrollHeight -
        contentContainer.current.offsetHeight;
      if (contentContainer.current.scrollTop < scrollableArea) {
        setShowNewMessageBar(true);
      }
    }
  }, [newMessageBarChat, showNewMessageBar]);

  useEffect(() => {
    // console.log("MESSAGE IS CHANGED!!");
    const { scrollTop, scrollHeight, offsetHeight } = contentContainer.current;
    // console.log(`ScrollTop : ${scrollTop}`);
    // console.log(`scrollHeight : ${scrollHeight}`);
    // console.log(`offsetHeight : ${offsetHeight}`);
    const needToGoBottom =
      scrollTop > 0 &&
      Math.abs(scrollHeight - (scrollTop + offsetHeight)) < 100;
    const isFirstLoad = messageList.length > 0 && !scrollInitialized;
    // console.log(`needToGoBottom : ${needToGoBottom}`);
    // console.log(`is First : ${isFirstLoad}`);

    // 첫 메시지 불러왔을 때만 아래로 내려버림
    if (isFirstLoad || needToGoBottom) {
      contentContainer.current.scrollTop = Number.MAX_SAFE_INTEGER;
      setScrollInitialized(true);
    } else if (previousFirstChild.current) {
      // console.log("MAY BE U LOAD MORE!");
      // console.log(previousFirstChild.current);
      // console.log(previousFirstChild.current.scrollTop);
      // console.log(`offsetHeight : ${previousFirstChild.current.offsetHeight}`);
      previousFirstChild.current.scrollIntoView();
      previousFirstChild.current = null;
    }

    const scrollableArea =
      contentContainer.current.scrollHeight -
      contentContainer.current.offsetHeight;

    if (contentContainer.current.scrollTop < scrollableArea) {
      setShowNewMessageBar(true);
    }
  }, [messageList, scrollInitialized]);

  const hideNewMesageBar = () => {
    contentContainer.current.scrollTop = Number.MAX_SAFE_INTEGER;
  };

  const setPlaceHolder = () => {
    switch (chatStatus) {
      case 'UNINITIALIZED':
        return '채팅 서버와 연결 중 입니다';
      case 'CONNECTED':
        return `${customerName}에게 메시지 보내기`;
      case 'DISCONNECTED':
        return '서버와의 연결이 끊켰습니다';
      case 'USERDISCONNECTED':
        return '고객과의 상담이 종료되었습니다';
    }
  };

  const onSocketConnected = (e) => {
    console.log(`CONNECTED /sub/room_activity/${roomId}`);
    const lastItem =
      messageList && messageList.length
        ? messageList[messageList.length - 1]
        : null;
    const result =
      lastItem &&
      lastItem.speaker === 'SYSTEM' &&
      (lastItem.systemActivityType === 'USER_BLOCKED' ||
        lastItem.systemActivityType === 'END_SESSION');
    setChatStatus(result ? 'USERDISCONNECTED' : 'CONNECTED');
    textareaRef?.current?.focus();
  };

  const onSocketDisconnected = (e) => {
    console.log(`DISCONNECTED /sub/room_activity/${roomId}`);
    setChatStatus('DISCONNECTED');
  };

  return (
    <div className={cx('container')}>
      <SockJsClient
        url={`${serverUrl}/ws`}
        topics={[`/sub/room/${roomId}`, `/sub/room_activity/${roomId}`]}
        onMessage={onNewChatComming}
        ref={socketClient}
        headers={connectionHeaders}
        onDisconnect={onSocketDisconnected}
        onConnect={onSocketConnected}
      />
      <div className={cx('header')}>
        <p className={cx('name')}>{customerName}</p>
        <div className={cx('iconButton')} onClick={() => onClose(data)}>
          <CloseIcon />
        </div>
      </div>
      <div className={cx('content')} ref={contentContainer}>
        {messageList.map((chat) => createMessage(chat))}
      </div>
      <div className={cx('footer')}>
        <div className={cx('toolbar')}>
          <div className={cx('iconButton')}>
            <label htmlFor={`${roomId}-file-input`}>
              <ImageIcon />
            </label>
            <input
              id={`${roomId}-file-input`}
              type="file"
              accept="image/*"
              onChange={onImageSelected}
              className={cx('imageInput')}
            />
          </div>
          <div className={cx('iconButton')}>
            <EmojiIcon />
          </div>
        </div>
        <div className={cx('chatInputArea')}>
          <textarea
            style={{ height: `${inputHeight}px` }}
            value={inputValue}
            onChange={onInputChange}
            className={cx('chatInput')}
            placeholder={setPlaceHolder()}
            onKeyPress={(e) => {
              if (e.key == 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                onMessageClicked();
              }
            }}
            disabled={chatStatus !== 'CONNECTED'}
            ref={textareaRef}
          />
          <button
            className={cx('submit', inputValue !== '' && 'enable')}
            onClick={onMessageClicked}
          >
            전송
          </button>
        </div>
        <div className={cx('ingText')}>
          {writingUserMessage.length > 0 && (
            <>
              <p>{`${writingUserMessage}`}</p>
              <Dots />
            </>
          )}
        </div>
        <div
          className={cx('newMessageBar', showNewMessageBar && 'active')}
          onClick={() => hideNewMesageBar()}
        >
          <p className={cx('name')}>{newMessageBarChat?.speakerName || ''}</p>
          <p className={cx('message')}>
            {newMessageBarChat?.messageText || ''}
          </p>
          <div className={cx('toBottomIcon')}>
            <ToBottomICon />
          </div>
        </div>
      </div>
    </div>
  );
};
