// 유저 컨트롤러
import userModel from '../models/userModel.js';
import { asyncHandler, getCurrentTimestamp } from './utils.js';

// 로그인
export const login = asyncHandler(async (req, res) => {
    const { account_id, password } = req.body;

    const result = await userModel.login(account_id, password);
    if (!result) {
        return res.status(404).json({ message: 'The account does not exist or entered an incorrect password.' });
    }

    return res.status(200).json({ message: 'Successfully Login!' });
});

// 회원가입
export const register = asyncHandler(async (req, res) => {
    const { student_id, major, nickname, account_id, password } = req.body;

    const result = await userModel.register(student_id, account_id, password, nickname, major);
    if (!result) {
        return res.status(404).json({ message: 'An error occurred. Please try again.' });
    } else {
        return res.status(200).json({ message: 'Successfully Register!' });
    }
});