import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import pool from './config/db.js';

import productRoutes from './routes/productRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// const { application } = require('express');
app.use('/uploads', express.static('uploads'));

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
//apllication/json
app.use(bodyParser.json());

app.use(cookieParser());

app.get('/', (req, res) => res.send('Hello World! from SWE3002 Team11 SKKU market.'))


app.use(cors({
  origin: 'http://localhost:3000',  // 필요한 프론트엔드 URL 추후에 연결 후  설정
  credentials: true
}));
app.use(express.json());

// MySQL 연결 테스트 API

app.get('/', (req, res) => {
  res.send('Welcome to the API!');
});

app.get('/api/test', async (req, res) => {
  const [rows] = await pool.query('SELECT 1 + 1 AS solution');
  res.json({ solution: rows[0].solution });
});

// 상품 등록 및 검색 라우트
app.use('/product', productRoutes);

// 에러 핸들링 미들웨어 추가
app.use((err, req, res, next) => {
  if (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '파일 크기가 너무 큽니다. 최대 30MB까지 업로드할 수 있습니다.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err.message === '허용되지 않는 파일 형식입니다.') {
      return res.status(400).json({ error: err.message });
    } else {
      return res.status(500).json({ error: err.message });
    }
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});