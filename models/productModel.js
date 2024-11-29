// 상품 모델
import pool from '../config/db.js';

const productModel = {};

// 상품 등록
productModel.createProduct = async (productData) => {
  const sql = `
    INSERT INTO Product (user_id, image_url, title, price, description, category_id, location, status, keywords, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const params = [
    productData.user_id,      // 사용자 ID
    productData.image_url,    // 사진 URL
    productData.title,        // 제목
    productData.price,        // 가격
    productData.description,  // 상품 상세 설명
    productData.category_id,  // 카테고리 ID
    productData.location,     // 희망 거래 장소
    productData.status,       // 상품 상태 (나쁨/보통/좋음)
    productData.keywords,     // 상품 키워드
  ];

  const [result] = await pool.execute(sql, params);
  return result.insertId;
};

// 상품 검색
productModel.searchProducts = async (filters) => {
  let sql = `
    SELECT
      p.*
    FROM Product p
  `;
  const params = [];

  const whereClauses = [];

  // 판매자 전공 필터 있을 때만 User 테이블과 join
  if (filters.seller_major) {
    sql += `
      JOIN User u ON p.user_id = u.id
    `;
    whereClauses.push('u.major = ?');
    params.push(filters.seller_major);
  }

  if (filters.searchTerm) {
    whereClauses.push('(p.title LIKE ? OR p.keywords LIKE ?)');
    const searchPattern = `%${filters.searchTerm}%`;
    params.push(searchPattern, searchPattern);
  }

  if (filters.category_id) {
    whereClauses.push('p.category_id = ?');
    params.push(filters.category_id);
  }
  if (filters.priceMin) {
    whereClauses.push('p.price >= ?');
    params.push(filters.priceMin);
  }
  if (filters.priceMax) {
    whereClauses.push('p.price <= ?');
    params.push(filters.priceMax);
  }
  if (filters.location) {
    whereClauses.push('p.location = ?');
    params.push(filters.location);
  }
  if (filters.status) {
    whereClauses.push('p.status = ?');
    params.push(filters.status);
  }
  if (filters.keywords) {
    whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.keywords LIKE ?)');
    const keywordPattern = `%${filters.keywords}%`;
    params.push(keywordPattern, keywordPattern, keywordPattern);
  }
  
  if (filters.seller_major) {
    whereClauses.push('u.major = ?');
    params.push(filters.seller_major);
  }

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }
  
  sql += ' ORDER BY p.created_at DESC';

  const [rows] = await pool.execute(sql, params);
  return rows;
};

// 상품 정보 가져오기
productModel.getProductById = async (productId) => {
  const sql = `
    SELECT
      p.id,
      p.image_url,
      p.title,
      p.created_at,
      p.price,
      p.keywords AS transaction_place,
      p.description,
      u.id AS seller_id,
      u.nickname AS seller_nickname,
      u.major AS seller_major
    FROM Product p
    JOIN User u ON p.user_id = u.id
    WHERE p.id = ?
  `;

  const [rows] = await pool.execute(sql, [productId]);
  return rows[0];
};



export default productModel;