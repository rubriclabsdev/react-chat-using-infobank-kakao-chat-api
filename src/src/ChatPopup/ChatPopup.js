import classNames from 'classnames/bind';
import React, {
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ReactComponent as CloseIcon } from '../../resources/images/close-icon.svg';
import { ReactComponent as ImageIcon } from '../../resources/images/image-icon.svg';
import { ReactComponent as EmojiIcon } from '../../resources/images/emoji-icon.svg';
import { ReactComponent as Dots } from '../../resources/images/dotdotdot.svg';
import styles from './ChatPopup.module.css';
import { SystemMessage } from './SystemMessage';
import { UserMessage } from './UserMessage';
import SockJsClient from 'react-stomp';

export const ChatPopup = ({
  onClose,
  data,
  connectionHeaders,
  brandId,
  serverUrl,
  ...props
}) => {
  const { roomId, customerName } = data;
  const cx = classNames.bind(styles);
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(22);
  const [messageList, setMessageList] = useState([]);
  const [scrollInitialized, setScrollInitialized] = useState(false);
  const [writingUser, setWritingUser] = useState('');
  const messageListRef = useRef([]);
  const contentContainer = useRef(null);
  const chatOffset = useRef(null);
  const socketClient = useRef({});
  const previousFirstChild = useRef(null);

  const onInputChange = (e) => {
    const targetHeight = Math.min(e.target.scrollHeight, 126);
    setInputHeight(e.target.value === '' ? 22 : targetHeight);
    setInputValue(e.target.value);
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
    // console.log("NEW MESSAGE!");
    // console.log(message);
    // console.log(channelName);

    if (channelName.includes('room_activity')) {
    } else {
      const index = messageList.findIndex(
        (prevMsg) => prevMsg.id === message.id
      );

      if (index !== -1) {
        let newResult = [...messageList];
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

  console.log(contentContainer);

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

  function onMouseWheel(e) {
    // e.wheelDelta 는 현재 wheel 이 현재 움직이는 중인지 확인하기 위함임
    // 새로운 컴포넌트에 또 필요하면 컴포넌트 별로 eventListener 달아줘야함.
    var delta = e.type === 'mousewheel' ? e.wheelDelta : e.detail * -40;
    console.log(delta);
    const el = contentContainer.current;

    const scrollableArea = el.scrollHeight - el.offsetHeight;

    if (delta < 0 && scrollableArea - el.scrollTop <= 0) {
      el.scrollTop = el.scrollHeight;
      e.preventDefault();
    } else if (delta > 0 && delta > el.scrollTop) {
      el.scrollTop = 0;
      e.preventDefault();
    }
  }

  function onScroll(e) {
    if (e.target.scrollTop === 0 && chatOffset.current !== -1) {
      // console.log('NEED MORE!!!!!!!!')
      getPreviousMessageList();
    }
  }

  useEffect(() => {
    getPreviousMessageList();
    contentContainer.current.addEventListener('mousewheel', onMouseWheel);
    contentContainer.current.addEventListener('scroll', onScroll);
    return () => {
      contentContainer.current.removeEventListener('mousewheel', onMouseWheel);
      contentContainer.current.removeEventListener('scroll', onScroll);
    };
  }, []);

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
  }, [messageList, scrollInitialized]);

  return (
    <div className={cx('container')}>
      <SockJsClient
        url={`${serverUrl}/ws`}
        topics={[`/sub/room/${roomId}`, `/sub/room_activity/${roomId}`]}
        onMessage={onNewChatComming}
        ref={socketClient}
        headers={connectionHeaders}
        onDisconnect={(e) => {
          console.log(`DISCONNECTED /sub/room_activity/${roomId}`);
        }}
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
            placeholder="값을 입력 해 주세요"
            onKeyPress={(e) => {
              if (e.key == 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                onMessageClicked();
              }
            }}
          />
          <button
            className={cx('submit', inputValue !== '' && 'enable')}
            onClick={onMessageClicked}
          >
            전송
          </button>
        </div>
        <div className={cx('ingText')}>
          {false && (
            <>
              <p>{`${writingUser}님이 입력중입니다`}</p>
              <Dots />
            </>
          )}
        </div>
        <div className={cx('newMessageBar', false && 'active')} />
      </div>
    </div>
  );
};
