import { Router } from 'express';
import { getBalance, postCharge, postWithdraw } from '../controllers/walletController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /wallet!');
});

// 스꾸머니 보유량 확인 로직
router.get('/balance/:user_id', getBalance);

// 스꾸머니 충전 로직
router.post('/charge', postCharge);

// 스꾸머니 인출 로직
router.post('/withdraw', postWithdraw);

export default router;