import pool from '../config/db.js';
import walletModel from '../models/walletModel.js';
import transactionModel from '../models/transactionModel.js';
import productModel from '../models/productModel.js';
import { asyncHandler } from './utils.js';

// 구매자가 구매 요청
export const postRequestTransaction = asyncHandler(async (req, res) => {
    const { product_id, seller_id, buyer_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/request");

    // 유효성 검증
    if (!product_id) {
        return res.status(400).json({ message: 'Invalid product_id' });
    } else if (!seller_id) {
        return res.status(400).json({ message: 'Invalid seller_id' });
    } else if (!buyer_id) {
        return res.status(400).json({ message: 'Invalid buyer_id' });
    }

    // 상품 정보 가져오기
    console.log('Fetch Product');
    const product = await productModel.getProductById(product_id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // 구매자 정보 가져오기 
    console.log('Fetch Buyer');
    const buyer = await transactionModel.getBuyerById(buyer_id);
    if (!buyer) {
        return res.status(404).json({ message: 'Buyer not found' });
    }

    // 판매자 정보 가져오기
    console.log('Fetch Seller');
    const seller = await transactionModel.getSellerById(seller_id);
    if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
    }

    // 구매자 잔액 확인
    const { balance } = buyer;
    const { price } = product;

    if (balance < price) {
        return res.status(400).json({
            message: 'Insufficient buyer balance',
            balance: balance,
            price: price
        });
    }

    // 거래 생성 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        // 신규 거래 생성
        console.log('Create New Transaction');
        const transactionId = await transactionModel.createTransaction(product_id, seller_id, buyer_id, connection);
        if (!transactionId) { // 거래 생성 실패 예외처리
            throw new Error('Transaction creation failed');
        }

        // 구매자의 스꾸머니 잔액 차감
        console.log('Update Buyer Balance');
        const success = await transactionModel.updateBalance(buyer_id, price, '-', connection);
        if (!success) { // 구매자 잔액 차감 실패 예외처리
            throw new Error('Failed to update buyer balance');
        }

        // 구매자의 스꾸머니 차감 기록
        console.log('Log SKKUMoney Transaction');
        const moneyTransactionId = await walletModel.addTransaction(buyer_id, price, balance - price, "request", connection)
        if (!moneyTransactionId) { // 스꾸머니 기록 실패 예외처리
            throw new Error('Failed to log SKKUMoney transaction');
        }

        await connection.commit();

        res.status(201).json({
            message: 'Transaction requested',
            transaction_id: transactionId
        });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});

// 판매자가 구매 요청 거부
export const postRejectTransaction = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/reject");

    // 유효성 검증
    if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid transaction_id' });
    }

    // 거래 정보 가져오기
    console.log("Fetch transaction");
    const transaction = await transactionModel.getTransactionById(transaction_id);
    if (!transaction) { // 거래 인스턴스가 없음
        return res.status(404).json({ message: 'Transaction not found' });
    } else if (transaction.status !== 'Requested') { // Requested -> Rejected 이어야함.
        return res.status(400).json({
            message: `Current status of transaction is ${transaction.status}. status must be Requested to reject transaction from seller.`
        });
    }

    // 구매자 정보 가져오기
    console.log('Fetch Buyer');
    const buyer = await transactionModel.getBuyerById(transaction.buyer_id);
    if (!buyer) {
        return res.status(404).json({ message: 'Buyer not found' });
    }

    // 상품 정보 가져오기
    console.log('Fetch Product');
    const product = await productModel.getProductById(transaction.product_id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // 구매 요청 거부 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        // 거래 상태 변경
        console.log('Update Transaction Status');
        const successTransaction = await transactionModel.updateTransactionStatus(transaction_id, 'Rejected', connection);
        
        if (!successTransaction) {
            throw new Error('Failed to update transaction');
        }
        // 구매자 잔액 증가
        console.log('Update Buyer Balance');
        const successBalance = await transactionModel.updateBalance(transaction.buyer_id, product.price, '+', connection);
        if (!successBalance) {
            throw new Error('Failed to update buyer balance');
        }
        // 스꾸머니 내역 기록
        console.log('Log SKKUMoney Transaction');
        const moneyTransactionId = await walletModel.addTransaction(transaction.buyer_id, product.price, buyer.balance + product.price, "canceled", connection);
        if (!moneyTransactionId) { // 스꾸머니 기록 실패 예외처리
            throw new Error('Failed to log SKKUMoney transaction');
        }

        await connection.commit();

        res.status(200).json({ message: 'Transaction rejected' });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});

// 판매자가 구매 요청 수락
export const postAcceptTransaction = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/accept");
    // 유효성 검증
    if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid transaction_id' });
    }

    // 거래 데이터 가져오기
    console.log("Fetch Transaction");
    const transaction = await transactionModel.getTransactionById(transaction_id);
    if (!transaction) { // 거래 인스턴스가 없음
        return res.status(404).json({ message: 'Transaction not found' });
    } else if (transaction.status !== 'Requested') { // Requested -> Accepted
        return res.status(400).json({
            message: `Current status of transaction is ${transaction.status}. status must be Requested to accept transaction from seller.`
        });
    }

    // 거래 상태를 수락으로 업데이트
    console.log("Update Transaction Status");
    const success = await transactionModel.updateTransactionStatus(transaction_id, 'Accepted', null);
    if (!success) {
        return res.status(500).json({ message: 'Failed to update transaction' });
    }

    res.status(200).json({ message: 'Transaction accepted' });
});

// 판매자가 상품 전달 완료
export const postDeliverProduct = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/deliver");
    // 유효성 검증
    if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid transaction_id' });
    }

    // 거래 데이터 가져오기
    console.log("Fetch Transaction");
    const transaction = await transactionModel.getTransactionById(transaction_id);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    } else if (transaction.status !== 'Accepted') { // Accepted -> Delivered
        return res.status(400).json({
            message: `Current status of transaction is ${transaction.status}. status must be Accepted to deliver product from seller.`
        });
    }

    // 거래 상태를 전달 완료로 업데이트
    console.log("Update Transaction Status");
    const success = await transactionModel.updateTransactionStatus(transaction_id, 'Delivered', null);
    if (!success) {
        return res.status(500).json({ message: 'Failed to update transaction' });
    }

    res.status(200).json({ message: 'Product delivered' });
});

// 구매자가 상품 전달 확인
export const postConfirmDelivery = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/confirm");

    // 유효성 검증
    if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid transaction_id' });
    }

    // 거래 데이터 가져오기
    console.log("Fetch Transaction");
    const transaction = await transactionModel.getTransactionById(transaction_id);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    }
    if (transaction.status !== 'Delivered') { // Delivered -> Completed
        return res.status(400).json({
            message: `Current status of transaction is ${transaction.status}. status must be Delivered to confirm delivery from buyer.`
        });
    }

    // 판매자 정보 가져오기 
    console.log("Fetch Seller");
    const seller = await transactionModel.getSellerById(transaction.seller_id);
    if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
    }

    // 상품 정보 가져오기
    console.log("Fetch Product");
    const product = await productModel.getProductById(transaction.product_id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // 상품 전달 확인(== 거래 완료) 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        // 거래 상태를 완료로 업데이트
        console.log("Update Transaction Status");
        const successTransaction = await transactionModel.updateTransactionStatus(transaction_id, 'Completed', connection);
        if (!successTransaction) {
            throw new Error('Failed to update transaction');
        }

        // 판매자 스꾸머니 잔액 증가
        console.log("Update Seller Balance");
        const successBalance = await transactionModel.updateBalance(transaction.seller_id, product.price, '+', connection);
        if (!successBalance) {
            throw new Error('Failed to update seller balance');
        }

        // 판매자 스꾸머니 내역 기록
        console.log("Log SKKUMoney Transaction");
        const moneyTransactionId = await walletModel.addTransaction(
            transaction.seller_id,
            product.price,
            seller.balance + product.price,
            "sold",
            connection
        )
        if (!moneyTransactionId) { // 스꾸머니 기록 실패 예외처리
            throw new Error('Failed to log SKKUMoney transaction');
        }

        await connection.commit();

        res.status(200).json({ message: 'Transaction completed' });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});

// 구매자가 거래 취소
export const postCancelTransaction = asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    console.log('==============================');
    console.log("POST - /transaction/cancel");

    // 유효성 검증
    if (!transaction_id) {
        return res.status(400).json({ message: 'Invalid transaction_id' });
    }

    // 거래 데이터 가져오기
    console.log('Fetch Transaction');
    const transaction = await transactionModel.getTransactionById(transaction_id);
    if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
    } else if (transaction.status !== 'Requested') { // Requested -> Cancelled
        return res.status(400).json({
            message: `Current status of transaction is ${transaction.status}. status must be Requested to cancel transaction from buyer.`
        });
    }

    // 구매자 정보 가져오기 
    console.log('Fetch Buyer');
    const buyer = await transactionModel.getBuyerById(transaction.buyer_id);
    if (!buyer) {
        return res.status(404).json({ message: 'Seller not found' });
    }

    // 상품 정보 가져오기
    console.log("Fetch Product");
    const product = await productModel.getProductById(transaction.product_id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    // 구매자의 거래 취소 트랜잭션 처리
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        // 거래 상태를 취소로 업데이트
        console.log("Update Transcation Status");
        const success = await transactionModel.updateTransactionStatus(transaction_id, 'Cancelled', connection);
        if (!success) {
            throw new Error('Failed to cancel transaction');
        }

        // 구매자 잔액 증가
        console.log("Update Buyer Balance");
        const successBalance = await transactionModel.updateBalance(transaction.buyer_id, product.price, '+', connection);
        if (!successBalance) {
            throw new Error('Failed to update seller balance');
        }

        // 스꾸머니 기록
        console.log("Log SKKUMoney Transcation");
        const moneyTransactionId = await walletModel.addTransaction(
            transaction.buyer_id,
            product.price,
            buyer.balance + product.price,
            "cancelled",
            connection

        )
        if (!moneyTransactionId) { // 스꾸머니 기록 실패 예외처리
            throw new Error('Failed to log SKKUMoney transaction');
        }

        await connection.commit();

        res.status(200).json({ message: 'Transaction cancelled' });
    } catch (error) {
        await connection.rollback(); // 트랜잭션 롤백
        res.status(500).json({ message: 'Transaction failed', error: error.message });
    } finally {
        connection.release(); // DB 연결 해제
    }
});