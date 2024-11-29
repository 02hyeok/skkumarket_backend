import { Router } from 'express';
import {
    getFetchAccountsController,
    postAddAccountController,
    postDeleteAccountController
} from '../controllers/accountController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /account');
});

// 사용자가 등록한 계좌 전체 조회
router.get('/fetch/:user_id', getFetchAccountsController);

// 사용자 계좌 추가
router.post('/add', postAddAccountController);

// 사용자 계좌 삭제
router.post('/delete', postDeleteAccountController);

export default router;