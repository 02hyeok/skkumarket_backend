import pool from '../config/db.js';

// 사용자 계좌 추가
export const addAccount = async (userId, bank, accountNumber) => {
    const query = `
        INSERT INTO skkumarket.UserAccount (user_id, bank, account_number)
        VALUES (?, ?, ?)
    `;
    return await pool.execute(query, [userId, bank, accountNumber]);
};

// 사용자 계좌 삭제
export const deleteAccount = async (userId, bank, accountNumber) => {
    const query = `
        DELETE FROM skkumarket.UserAccount
        WHERE user_id = ? AND bank = ? AND account_number = ?
    `;
    return await pool.execute(query, [userId, bank, accountNumber]);
};

// 사용자가 등록한 계좌 전체 조회
export const fetchAccounts = async (userId) => {
    const query = `
        SELECT id, bank, account_number, created_at
        FROM skkumarket.UserAccount
        WHERE user_id = ?
    `;
    return await pool.execute(query, [userId]);
};
