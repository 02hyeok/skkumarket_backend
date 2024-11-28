// 거래 모델
import pool from '../config/db.js';

const transactionModel = {};

// 판매자 정보 조회
transactionModel.getSellerById = async (seller_id) => {
    const sql = 'SELECT user_id, balance FROM SKKUMoney WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [seller_id]);
    return rows[0]; // 판매자 정보 반환
};

// 구매자 정보 조회
transactionModel.getBuyerById = async (buyer_id) => {
    const sql = 'SELECT user_id, balance FROM SKKUMoney WHERE user_id = ?';
    const [rows] = await pool.execute(sql, [buyer_id]);
    return rows[0]; // 구매자 정보 반환
};

// 구매자/판매자 스꾸머니 차감/증가
transactionModel.updateBalance = async(user_id, amount, symbol, connection) => {
    const sql = `
        UPDATE SKKUMoney
        SET balance = balance ${symbol} ?
        WHERE user_id = ?
    `
    if (!connection) {
        const [result] = await pool.execute(sql, [amount, user_id, symbol]);
        return result.affectedRows > 0; // 성공 여부 반환    
    }
    const [result] = await connection.query(sql, [amount, user_id, symbol]);
    return result.affectedRows > 0; // 성공 여부 반환    
}

// 거래 생성 (구매 요청)
transactionModel.createTransaction = async (product_id, seller_id, buyer_id, connection) => {
    const sql = `
        INSERT INTO ProductTransaction (product_id, seller_id, buyer_id, status)
        VALUES (?, ?, ?, 'Requested')
    `;

    if (!connection) {
        const [result] = await pool.execute(sql, [product_id, seller_id, buyer_id]);
        return result.insertId;
    }
    const [result] = await connection.query(sql, [product_id, seller_id, buyer_id]);
    return result.insertId;
};

// 거래 상태 업데이트
transactionModel.updateTransactionStatus = async (transaction_id, status, connection) => {
    const sql = `
        UPDATE ProductTransaction
        SET status = ?
        WHERE id = ?
    `;
    if (!connection) {
        const [result] = await pool.execute(sql, [status, transaction_id]);
        return result.affectedRows > 0; // 성공 여부 반환
    }
    const [result] = await connection.query(sql, [status, transaction_id]);
    return result.affectedRows > 0; // 성공 여부 반환
};

// 거래 정보 조회
transactionModel.getTransactionById = async (transaction_id) => {
    const sql = `
        SELECT *
        FROM ProductTransaction
        WHERE id = ?
    `;
    const [rows] = await pool.execute(sql, [transaction_id]);
    return rows[0];
};

export default transactionModel;