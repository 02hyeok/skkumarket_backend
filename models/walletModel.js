// 지갑 모델
import pool from '../config/db.js';

const walletModel = {};

// 현재 잔액 가져오기
walletModel.getBalance = async (userId) => {
    const sql = 'SELECT user_id, balance FROM SKKUMoney WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [userId]);
    return rows[0]; // 결과가 없으면 undefined 반환
};

// 포인트 충전
walletModel.chargeBalance = async (userId, amount) => {
    const sql = 'UPDATE SKKUMoney SET balance = balance + ? WHERE user_id = ?';
    const [result] = await pool.execute(sql, [amount, userId]);
    return result.affectedRows; // 성공 여부 반환
};

// 포인트 인출
walletModel.withdrawBalance = async (userId, amount) => {
    const sql = 'UPDATE SKKUMoney SET balance = balance - ? WHERE user_id = ?';
    const [result] = await pool.execute(sql, [amount, userId]);
    return result.affectedRows; // 성공 여부 반환
};

// 사용자 검색
walletModel.findUser = async (userId) => {
    const sql = 'SELECT balance FROM SKKUMoney WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [userId]);
    return rows[0]; // 결과가 없으면 undefined 반환
};

// 트랜잭션 기록 추가
walletModel.addTransaction = async (userId, amount, balance, type, createdAt) => {
    const sql = `
        INSERT INTO SKKUMoneyTransaction (user_id, amount, balance, type, created_at)
        VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [userId, amount, balance, type, createdAt]);
    return result.insertId; // 새 트랜잭션 ID 반환
};

export default walletModel;