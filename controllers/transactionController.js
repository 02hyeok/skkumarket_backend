import transactionModel from '../models/transactionModel.js';
import { asyncHandler, getCurrentTimestamp } from './utils.js';

// 거래 체결
export const postTransaction = asyncHandler(async (req, res) => {
    const { product_id, seller_id, buyer_id } = req.body;

    // 유효성 검사
    if (!product_id || !seller_id || !buyer_id) {
        return res.status(400).json({ message: 'Invalid product_id, seller_id, or buyer_id' });
    }

    // 판매자, 구매자, 상품 정보 가져오기
    const seller = await transactionModel.getSellerById(seller_id);
    if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
    }

    const buyer = await transactionModel.getBuyerById(buyer_id);
    if (!buyer) {
        return res.status(404).json({ message: 'Buyer not found' });
    }

    const product = await transactionModel.getProductById(product_id, seller_id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found or not owned by seller' });
    }

    const productPrice = product.price;

    // 구매자 잔액 확인
    if (buyer.balance < productPrice) {
        return res.status(400).json({ message: 'Buyer has insufficient balance' });
    }

    // 트랜잭션 처리
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // 트랜잭션 시작

        // 구매자 잔액 감소
        await transactionModel.decreaseBuyerBalance(buyer_id, productPrice);

        // 판매자 잔액 증가
        await transactionModel.increaseSellerBalance(seller_id, productPrice);

        // 거래 기록 추가
        const createdAt = getCurrentTimestamp();
        await transactionModel.addTransaction(product_id, seller_id, buyer_id, createdAt);

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
