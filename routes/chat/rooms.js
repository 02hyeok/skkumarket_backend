import express from 'express';
import chatModel from '../../models/chatModel.js';

const router = express.Router();

// 채팅방 목록 가져오기
router.get('/', async (req, res) => {
    try {
        const rooms = await chatModel.getAllChats(); // 데이터베이스에서 모든 채팅방 가져오기
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat rooms' });
    }
});

export default router;
