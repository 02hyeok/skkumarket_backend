// 지갑 컨트롤러
import pool from '../config/db.js';
import walletModel from '../models/walletModel.js';
import { asyncHandler } from './utils.js';

const CHARGE = 'charge';
const WITHDRAW = 'withdraw';

// 현재 포인트 확인
export const getBalance = asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    console.log('==============================');
    console.log("GET - /wallet/balance");
    console.log("Fetch User");
    const user = await walletModel.getBalance(user_id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
        user_id: user.user_id,
        balance: user.balance,
    });
});

// 충전 및 인출 내역 가져오기
export const getHistory = asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    console.log('==============================');
    console.log("GET - /wallet/history");
    console.log("Fetch SKKUMoney Transaction");
    if (!user_id) {
        return res.status(400).json({ message: 'Invalid user_id' });
    }

    const transactions = await walletModel.getTransactionHistory(user_id);
    if (!transactions || transactions.length === 0) {
        return res.status(404).json({ message: 'No transactions found for the user' });
    }

    res.status(200).json({
        user_id,
        transactions,
    });
});

// 포인트 충전
export const postCharge = asyncHandler(async (req, res) => {
    const { user_id, amount } = req.body;
    console.log('==============================');
    console.log("POST - /wallet/charge");
    
    if (!user_id || amount <= 0) {
        return res.status(400).json({ message: 'Invalid user_id or amount' });
    }

    console.log("Fetch User");
    const user = await walletModel.findUser(user_id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = user.balance;

    // 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        console.log("Update Balance");
        const succesCharge = await walletModel.chargeBalance(user_id, amount, connection);
        if (!succesCharge) {
            throw new Error('Failed to charge');
        } 
        console.log("Log SKKUMoney Transaction");
        const successTransaction = await walletModel.addTransaction(user_id, amount, currentBalance + amount, CHARGE, connection);
        if (!successTransaction) {
            throw new Error('Failed to log SKKUMoney Transaction');
        } 
        await connection.commit();
        
        res.status(200).json({
            balance: currentBalance + amount,
            message: 'SKKUMoney charged successfully',
        });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});

// 포인트 인출
export const postWithdraw = asyncHandler(async (req, res) => {
    const { user_id, amount } = req.body;
    console.log('==============================');
    console.log("POST - /wallet/withdraw");

    if (!user_id || amount <= 0) {
        return res.status(400).json({ message: 'Invalid user_id or amount' });
    }

    console.log("Fetch User");
    const user = await walletModel.findUser(user_id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = user.balance;

    if (currentBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        console.log("Update Balance");
        const successWithdraw = await walletModel.withdrawBalance(user_id, amount, connection);
        if (!successWithdraw) {
            throw new Error('Failed to withdraw');
        } 
        console.log("Log SKKUMoney Transaction");
        const successTransaction = await walletModel.addTransaction(user_id, amount, currentBalance - amount, WITHDRAW, connection);
        if (!successTransaction) {
            throw new Error('Failed to log SKKUMoney Transaction');
        }

        res.status(200).json({
            balance: currentBalance - amount,
            message: 'SKKUMoney withdrawn successfully',
        });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});