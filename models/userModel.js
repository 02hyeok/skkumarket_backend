// 사용자 모델
import pool from '../config/db.js';

const userModel = {};

userModel.login = async (email, password) => {
    const sql = 'SELECT id, student_id, nickname, major FROM User WHERE email = ? AND password = ?';
    const [rows] = await pool.execute(sql, [email, password]);
    return rows[0]; // 결과가 없으면 undefined 반환
};

userModel.register = async (student_id, email, password, nickname, major) => {
    const sql = 'INSERT INTO User (student_id, email, password, nickname, major) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.execute(sql, [student_id, email, password, nickname, major]);
    return result.affectedRows // 삽입된 행위 개수 반환 (성공: 1, 실패: 0)
};

export default userModel;