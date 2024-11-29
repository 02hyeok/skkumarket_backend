import { addAccount, deleteAccount, fetchAccounts } from '../models/accountModel.js';

// 사용자가 등록한 계좌 전체 조회
export const getFetchAccountsController = async (req, res) => {
    const { user_id } = req.params;
    try {
        const [rows] = await fetchAccounts(user_id);
        if (rows.length == 0){
            return res.status(404).json({ message: '사용자 검색 실패'})
        }
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ message: '계좌 조회 실패', error: error.message });
    }
};

// 사용자 계좌 추가
export const postAddAccountController = async (req, res) => {
    const { user_id, bank, account_num } = req.body;
    try {
        await addAccount(user_id, bank, account_num);
        res.status(200).json({ message: '계좌 추가 성공' });
    } catch (error) {
        res.status(500).json({ message: '계좌 추가 실패', error: error.message });
    }
};

// 사용자 계좌 삭제
export const postDeleteAccountController = async (req, res) => {
    const { user_id, bank, account_num } = req.body;
    try {
        const [result] = await deleteAccount(user_id, bank, account_num);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '계좌 삭제 실패(등록된 계좌 아님)' });
        }
        res.status(200).json({ message: '계좌 삭제 성공' });
    } catch (error) {
        res.status(500).json({ message: '계좌 삭제 실패', error: error.message });
    }
};


