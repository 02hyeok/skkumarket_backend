import { Router } from 'express';
import { createChatController, getChatController, getAllChatsController, addMessageController, getMessagesController } from '../controllers/chatController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /chat');
});

// 채팅방 생성
router.post('/create', createChatController);

// 전체 채팅방 불러오기
router.get('/rooms/:user_id', getAllChatsController);

// 특정 채팅방 불러오기
router.get('/room/:chat_id', getChatController);

// 특정 채팅방에 메세지 보내기
router.post('/send/:chat_id', addMessageController);

// 지난 채팅로그 불러오기
router.get('/load_chat/:chat_id', getMessagesController);

export default router;