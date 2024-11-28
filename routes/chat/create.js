import express from 'express';
import chatModel from '../../models/chatModel.js';

const router = express.Router();

// 채팅방 생성
router.post('/', async (req, res) => {
    const { product_id, seller_id, buyer_id } = req.body;
    try {
        const roomID = await chatModel.createChat(product_id, seller_id, buyer_id);
        res.status(201).json({ id: roomID });
    } catch (error) {
        res.status(500).json({ message: 'Error creating chat room' });
    }
});

export default router;