import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import pool from './config/db.js';
import { readdir } from 'fs/promises';
import path from 'path';

import { socket } from './controllers/chatController.js';

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


/*
  아래는 동적 라우팅입니다. (routes 폴더를 라우팅)
  예 routes
      ㄴ test
        ㄴ a.js
  URL: http://localhost:3000/test/a
*/
const addRoutes = async (basePath, routeBase = '') => {
  const files = await readdir(basePath, { withFileTypes: true }); // 파일과 폴더 구분

  for (const file of files) {
      const fullPath = path.join(basePath, file.name);

      if (file.isDirectory()) {     // 디렉토리가 감지되면, 재귀 호출 진행
          await addRoutes(fullPath, `${routeBase}/${file.name}`);
      } else if (file.isFile() && file.name.endsWith('.js')) {    // 파일이면 라우팅
          const modulePath = new URL(`file://${fullPath}`);
          const route = await import(modulePath.href);
          const routeName = `${routeBase}/${file.name.replace('.js', '')}`;
          app.use(routeName, route.default);
      }
  }
};

await addRoutes(path.resolve('./routes'));

// 채팅 확인용 테스트 경로
app.use(express.static('public'));
app.get('/chatTest', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'chatTest.html'));
});

// 서버 실행
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

socket(server);