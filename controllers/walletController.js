// 지갑 컨트롤러
import walletModel from '../models/walletModel.js';
import { asyncHandler, getCurrentTimestamp } from './utils.js';

const CHARGE = 'charge';
const WITHDRAW = 'withdraw';

// 현재 포인트 확인
export const getBalance = asyncHandler(async (req, res) => {
    const { user_id } = req.params;

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

    if (!user_id || amount <= 0) {
        return res.status(400).json({ message: 'Invalid user_id or amount' });
    }

    const user = await walletModel.findUser(user_id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = user.balance;

    await walletModel.chargeBalance(user_id, amount);

    const createdAt = getCurrentTimestamp();
    await walletModel.addTransaction(user_id, amount, currentBalance + amount, CHARGE, createdAt);

    res.status(200).json({
        balance: currentBalance + amount,
        message: 'SKKUMoney charged successfully',
    });
});

// 포인트 인출
export const postWithdraw = asyncHandler(async (req, res) => {
    const { user_id, amount } = req.body;

    if (!user_id || amount <= 0) {
        return res.status(400).json({ message: 'Invalid user_id or amount' });
    }

    const user = await walletModel.findUser(user_id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = user.balance;

    if (currentBalance < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
    }

    await walletModel.withdrawBalance(user_id, amount);

    const createdAt = getCurrentTimestamp();
    await walletModel.addTransaction(user_id, amount, currentBalance - amount, WITHDRAW, createdAt);

    res.status(200).json({
        balance: currentBalance - amount,
        message: 'SKKUMoney withdrawn successfully',
    });
});