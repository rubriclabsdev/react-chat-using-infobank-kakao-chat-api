import React from 'react';

import { KakaoChat } from 'react-chat-using-infobank-kakao-chat-api';
import 'react-chat-using-infobank-kakao-chat-api/dist/index.css';

const App = () => {
  const token = localStorage.getItem('influencer-token');
  const connectHeaders = {
    Authorization: `Bearer ${token}`,
  };
  const { REACT_APP_CHAT_SERVER_URL } = process.env;

  return (
    <div className="container">
      <div className="bg"></div>
      <KakaoChat
        connectionHeaders={connectHeaders}
        brandId="1"
        serverUrl={REACT_APP_CHAT_SERVER_URL}
        brandName={'민호네'}
      />
    </div>
  );
};

export default App;
