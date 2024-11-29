import { Router } from 'express';
import { login, register } from '../controllers/userController.js';

const router = Router();

router.get('/', (req, res) => {
    res.send('Hello, World from /user');
});

router.post('/login', login);
router.post('/register', register);

export default router;