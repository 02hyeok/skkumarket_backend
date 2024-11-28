import { Router } from 'express';
import { postTransaction } from '../controllers/transactionController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /transaciton');
});

// 거래 채결 로직
router.post('/execute', postTransaction);


export default router;