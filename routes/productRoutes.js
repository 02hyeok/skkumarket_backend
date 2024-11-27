import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

// 상품 등록
router.post('/register', productController.registerProduct);
// 상품 검색
router.get('/search', productController.searchProducts);
// 상품 정보 가져오기
router.get('/:id', productController.getProductDetails);




export default router;