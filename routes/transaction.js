import { Router } from 'express';
import {
    postRequestTransaction,
    postRejectTransaction,
    postAcceptTransaction,
    postDeliverProduct,
    postConfirmDelivery,
    postCancelTransaction,
} from '../controllers/transactionController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /transaciton');
});

router.post('/request', postRequestTransaction); // 구매자가 구매 요청
router.post('/reject', postRejectTransaction); // 판매자가 구매 요청 거부
router.post('/accept', postAcceptTransaction); // 판매자가 구매 요청 수락
router.post('/deliver', postDeliverProduct); // 판매자가 상품 전달 완료
router.post('/confirm', postConfirmDelivery); // 구매자가 상품 전달 확인
router.post('/cancel', postCancelTransaction); // 구매자가 거래 취소

export default router;