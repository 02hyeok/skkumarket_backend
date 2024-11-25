const express = require('express');
const app = express();
const port = 3000
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// const { application } = require('express');

//application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));
//apllication/json
app.use(bodyParser.json());

app.use(cookieParser());


app.get('/', (req, res) => res.send('Hello World! from SWE3002 Team11 SKKU market.'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))