// 지갑 컨트롤러
import pool from '../config/db.js';
import { asyncHandler, getCurrentTimestamp } from './utils.js';

const CHARGE = 'charge';
const WITHDRAW = 'withdraw';

// 현재 포인트 확인
export const getBalance = asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    const connection = await pool.getConnection();

    const [user] = await connection.query('SELECT user_id, balance FROM SKKUMoney WHERE user_id = ?', [user_id]);

    connection.release(); // 연결 해제

    if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        user_id: user_id,
        balance: user[0].balance
    });
});

// 포인트 충전
export const postCharge = asyncHandler(async (req, res) => {
    const { user_id, amount } = req.body;

    // 유효성 검사
    if (!user_id) {
        return res.status(400).json({ message: 'Invalid user_id' });
    } else if (amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    const connection = await pool.getConnection(); // DB 연결

    // 사용자 검색
    try {
        const [user] = await connection.query('SELECT balance FROM SKKUMoney WHERE user_id = ?', [user_id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // 충전 전 잔액
        const currentBalance = user[0].balance;
        
        // 포인트 충전
        await connection.query('UPDATE SKKUMoney SET balance = balance + ? WHERE user_id = ?', [amount, user_id]);

        // 트랜잭션 기록
        const createdAt = getCurrentTimestamp(); // 현재 시점 생성
        await connection.query(
            'INSERT INTO SKKUMoneyTransaction (amount, balance, created_at, type, user_id) VALUES (?, ?, ?, ?, ?)',
            [amount, currentBalance, createdAt, CHARGE, user_id]
        );

        // 성공 응답
        res.status(200).json({ 
            balance: currentBalance + amount,
            message: 'Points charged successfully'
         });
    } finally {
        connection.release(); // DB 연결 해제
    }

});

// 포인트 인출
export const postWithdraw = asyncHandler(async (req, res) => {
    const { user_id, amount } = req.body;

    // 유효성 검사
    if (!user_id) {
        return res.status(400).json({ message: 'Invalid user_id' });
    } else if (amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    const connection = await pool.getConnection(); // DB 연결
    try {
        // 사용자 검색
        const [user] = await connection.query('SELECT balance FROM SKKUMoney WHERE user_id = ?', [user_id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // 인출 전 잔액
        const currentBalance = user[0].balance;

        // 잔액 부족 확인
        if (currentBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // 포인트 차감
        await connection.query('UPDATE SKKUMoney SET balance = balance - ? WHERE user_id = ?', [amount, user_id]);

        // 트랜잭션 기록
        const createdAt = getCurrentTimestamp(); // 현재 시점 생성
        await connection.query(
            'INSERT INTO SKKUMoneyTransaction (amount, balance, created_at, type, user_id) VALUES (?, ?, ?, ?, ?)',
            [amount, currentBalance, createdAt, WITHDRAW, user_id]
        );

        // 성공 응답
        res.status(200).json({
            balance: currentBalance - amount,
            message: 'Points withdrawn successfully' 
        });
    } finally {
        connection.release(); // DB 연결 해제
    }
});
