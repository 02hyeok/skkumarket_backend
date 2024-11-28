// 상품 컨트롤러
import productModel from '../models/productModel.js';

const productController = {};

// 상품 등록
productController.registerProduct = async (req, res) => {
  try {
    const productData = req.body;

    // 업로드된 이미지 파일 처리
    if (req.file) {
      // 이미지 URL 생성
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      productData.image_url = imageUrl;
    } else {
      return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
    }

    // 필수 필드 검증
    const requiredFields = ['user_id', 'title', 'price', 'description', 'category_id', 'location', 'status'];
    for (const field of requiredFields) {
      if (!productData[field]) {
        return res.status(400).json({ error: `필수 정보가 부족합니다: ${field}` });
      }
    }

    const productId = await productModel.createProduct(productData);

    res.status(201).json({ message: '상품이 등록되었습니다.', productId });
  } catch (error) {
    console.error('상품 등록 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 상품 검색
productController.searchProducts = async (req, res) => {
  try {
    const filters = req.query;
    const products = await productModel.searchProducts(filters);

    res.status(200).json(products);
  } catch (error) {
    console.error('상품 검색 오류:', error);
    res.status(500).json({ error: error.message });
  }
};

// 상품 정보 가져오기
productController.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productModel.getProductById(productId);

    if (!product) {
      return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('상품 상세 정보 오류:', error);
    res.status(500).json({ error: error.message });
  }
};




export default productController;