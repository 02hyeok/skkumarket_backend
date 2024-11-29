import express from 'express';
import productController from '../controllers/productController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});
  

const upload = multer({
    storage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 파일 크기 제한: 30MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('허용되지 않는 파일 형식입니다.'));
      }
    },
});

// 상품 등록
router.post('/register', upload.single('image'), productController.registerProduct);
// 상품 검색
router.get('/search', productController.searchProducts);
// 상품 정보 가져오기
router.get('/:id', productController.getProductDetails);




export default router;