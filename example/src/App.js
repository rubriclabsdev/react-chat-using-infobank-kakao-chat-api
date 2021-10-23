import React from 'react'

import { KakaoChat } from 'react-chat-using-infobank-kakao-chat-api'
import 'react-chat-using-infobank-kakao-chat-api/dist/index.css'

const App = () => {

  const SERVER_URL = 'https://influencer-chat.fnf.co.kr';
  const connectHeaders = {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1WGZYa0ZIZEdJeThLd25hVENLSHJ0d3MiLCJpYXQiOjE2MzQ1Mjc1MzIsImV4cCI6MTYzOTcxMTUzMn0.Ye0-InDPIo8nFNdrENOLxmh0pJWFi1Qw7yorDm_mOCo",
  };

  return (
    <div className="container">
      <div className='bg'></div>
      <KakaoChat
        connectionHeaders={connectHeaders}
        brandId={"1"}
        serverUrl={SERVER_URL}
        brandName={"민호네"}
      />
    </div>
  ) 
}

export default App
