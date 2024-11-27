// 거래 컨트롤러
import pool from '../config/db.js';
import { asyncHandler, getCurrentTimestamp } from './utils.js';

// 거래 채결
export const postTransaction = asyncHandler(async (req, res) => {
    const { product_id, seller_id, buyer_id } = req.body;

    // 유효성 검사
    if (!product_id) {
        return res.status(400).json({ message: 'Invalid product_id' });
    } else if (!seller_id) {
        return res.status(400).json({ message: 'Invalid seller_id' });
    } else if (!buyer_id) {
        return res.status(400).json({ message: 'Invalid buyer_id' });
    }

    const connection = await pool.getConnection();

    try {
        // 1. 판매자, 구매자, 상품 확인
        const [seller] = await connection.query('SELECT id, balance FROM user WHERE id = ?', [seller_id]);
        if (seller.length === 0) {
            return res.status(404).json({ message: 'Seller not found' });
        }

        const [buyer] = await connection.query('SELECT id, balance FROM user WHERE id = ?', [buyer_id]);
        if (buyer.length === 0) {
            return res.status(404).json({ message: 'Buyer not found' });
        }

        const [product] = await connection.query(
            'SELECT id, price, status FROM product WHERE id = ? AND user_id = ?',
            [product_id, seller_id]
        );
        if (product.length === 0) {
            return res.status(404).json({ message: 'Product not found or not owned by seller' });
        }

        // 2. 상품의 상태 확인
        if (product[0].status !== 'available') {
            return res.status(400).json({ message: 'Product is not available for purchase' });
        }

        const productPrice = product[0].price;

        // 3. 구매자의 잔액 확인
        if (buyer[0].balance < productPrice) {
            return res.status(400).json({ message: 'Buyer has insufficient balance' });
        }

        // 4. 거래 처리: 판매자와 구매자의 잔액 업데이트
        await connection.beginTransaction(); // 트랜잭션 시작

        // 구매자의 잔액 감소
        await connection.query('UPDATE user SET balance = balance - ? WHERE id = ?', [productPrice, buyer_id]);

        // 판매자의 잔액 증가
        await connection.query('UPDATE user SET balance = balance + ? WHERE id = ?', [productPrice, seller_id]);

        // 5. 상품 상태 업데이트 (판매 완료)
        await connection.query('UPDATE product SET status = ? WHERE id = ?', ['sold', product_id]);

        // 6. 거래 기록 추가
        const createdAt = getCurrentTimestamp();
        await connection.query(
            'INSERT INTO ProductTransaction (product_id, seller_id, buyer_id, created_at) VALUES (?, ?, ?, ?, ?)',
            [product_id, seller_id, buyer_id, createdAt]
        );

        await connection.commit(); // 트랜잭션 커밋

        // 성공 응답
        res.status(200).json({ message: 'Transaction completed successfully' });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});