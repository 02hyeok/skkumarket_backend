// 거래 모델
import pool from '../config/db.js';

const transactionModel = {};

// 판매자 정보 조회
transactionModel.getSellerById = async (sellerId) => {
    const sql = 'SELECT id, balance FROM user WHERE id = ?';
    const [rows] = await pool.execute(sql, [sellerId]);
    return rows[0]; // 판매자 정보 반환
};

// 구매자 정보 조회
transactionModel.getBuyerById = async (buyerId) => {
    const sql = 'SELECT id, balance FROM user WHERE id = ?';
    const [rows] = await pool.execute(sql, [buyerId]);
    return rows[0]; // 구매자 정보 반환
};

// 상품 정보 조회
transactionModel.getProductById = async (productId, sellerId) => {
    const sql = 'SELECT id, price FROM product WHERE id = ? AND user_id = ?';
    const [rows] = await pool.execute(sql, [productId, sellerId]);
    return rows[0]; // 상품 정보 반환
};

// 구매자 잔액 감소
transactionModel.decreaseBuyerBalance = async (buyerId, amount) => {
    const sql = 'UPDATE user SET balance = balance - ? WHERE id = ?';
    const [result] = await pool.execute(sql, [amount, buyerId]);
    return result.affectedRows > 0; // 성공 여부 반환
};

// 판매자 잔액 증가
transactionModel.increaseSellerBalance = async (sellerId, amount) => {
    const sql = 'UPDATE user SET balance = balance + ? WHERE id = ?';
    const [result] = await pool.execute(sql, [amount, sellerId]);
    return result.affectedRows > 0; // 성공 여부 반환
};

// 거래 기록 추가
transactionModel.addTransaction = async (productId, sellerId, buyerId, createdAt) => {
    const sql = `
        INSERT INTO ProductTransaction (product_id, seller_id, buyer_id, created_at)
        VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [productId, sellerId, buyerId, createdAt]);
    return result.insertId; // 거래 ID 반환
};

export default transactionModel;