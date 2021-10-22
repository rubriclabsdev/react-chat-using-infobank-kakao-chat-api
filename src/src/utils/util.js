import { LoremIpsum } from 'lorem-ipsum';

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

const makeFakeId = function (length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const createCustomerMessage = function () {
  const dt = new Date();
  const dtString = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt
    .getDate()
    .toString()
    .padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt
    .getHours()
    .toString()
    .padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;

  return {
    id: makeFakeId(8),
    chatRoomId: 0,
    speaker: 'CUSTOMER',
    messageType: 'TEXT',
    status: 'SUCCESS',
    speakerName: lorem.generateWords(1),
    speakerImageUrl: 'https://picsum.photos/200',
    messageText: lorem.generateSentences(3),
    refKey: '000',
    resultCode: '200',
    errorCode: null,
    messageDt: dtString,
  };
};

const createUserMessage = function () {
  const dt = new Date();
  const dtString = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt
    .getDate()
    .toString()
    .padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt
    .getHours()
    .toString()
    .padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;

  return {
    id: makeFakeId(8),
    chatRoomId: 0,
    speaker: 'USER',
    messageType: 'TEXT',
    status: 'SUCCESS',
    speakerName: lorem.generateWords(1),
    speakerImageUrl: 'https://picsum.photos/200',
    messageText: lorem.generateSentences(3),
    refKey: '000',
    resultCode: '200',
    errorCode: null,
    messageDt: dtString,
  };
};

const createSystemMessage = function () {
  const dt = new Date();
  const dtString = `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt
    .getDate()
    .toString()
    .padStart(2, '0')}/${dt.getFullYear().toString().padStart(4, '0')} ${dt
    .getHours()
    .toString()
    .padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}:${dt
    .getSeconds()
    .toString()
    .padStart(2, '0')}`;
  const randomNumber = parseInt(Math.random() * 10);

  return {
    id: makeFakeId(8),
    chatRoomId: 0,
    speaker: 'SYSTEM',
    messageType: 'TEXT',
    status: 'SUCCESS',
    systemActivityType: randomNumber % 2 === 1 ? 'DATE_CHANGE' : 'USER_BLOCKED',
    messageText: lorem.generateWords(2),
    refKey: '000',
    resultCode: '200',
    errorCode: null,
    messageDt: dtString,
  };
};

export const createMockMessage = function (size) {
  const result = [];
  for (let i = 0; i < size; i++) {
    const randomNumber = parseInt(Math.random() * 100);
    switch (randomNumber % 3) {
      case 0: {
        result.push(createCustomerMessage());
        break;
      }
      case 1: {
        result.push(createUserMessage());
        break;
      }
      case 2: {
        result.push(createSystemMessage());
        break;
      }
    }
  }

  return result;
};
