import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import pool from './config/db.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// const { application } = require('express');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});