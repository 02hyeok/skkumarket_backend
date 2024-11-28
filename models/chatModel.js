// 채팅 모델
import pool from '../config/db.js';

const chatModel = {};

// 채팅방 생성
chatModel.createChat = async (product_id, seller_id, buyer_id) => {
    const query = `
        INSERT INTO Chat (product_id, seller_id, buyer_id)
        VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [product_id, seller_id, buyer_id]);
    return result.insertId; // 생성된 채팅방 ID 반환
};

// 채팅방 정보
chatModel.getChat = async (chatID) => {
    const query = `
        SELECT C.id, C.product_id, C.seller_id, C.buyer_id, C.created_at, U.nickname AS seller_nickname
        FROM Chat C
        JOIN skkumarket.User U ON C.seller_id = U.id
        WHERE C.id = ?;
    `;
    const [rows] = await pool.query(query, [chatID]);
    return rows[0]; // 채팅방 정보 반환
};

// 채팅방 목록 확인
chatModel.getAllChats = async () => {
    const query = `
      SELECT * FROM Chat
    `;
    const [rows] = await pool.query(query);
    return rows; // 모든 채팅방 목록 반환
};

// 메시지 추가
chatModel.addMessage = async (chat_id, sender_id, message) => {
    const query = `
    INSERT INTO ChatMessage (chat_id, sender_id, message, send_at)
    VALUES (?, ?, ?, NOW())
    `;
    const [result] = await pool.query(query, [chat_id, sender_id, message]);
    return result.insertId; // 생성된 메시지 ID 반환
};
  
// 특정 채팅방의 모든 메시지 조회
chatModel.getMessages = async (chatID) => {
    const query = `
    SELECT * FROM ChatMessage
    WHERE chat_id = ?
    ORDER BY send_at ASC
    `;
    const [rows] = await pool.query(query, [chatID]);
    return rows; // 해당 채팅방의 메시지 목록 반환
};

export default chatModel;