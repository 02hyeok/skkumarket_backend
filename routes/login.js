import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
    const { email, password } = req.body;
});

export default router;