export const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export const getCurrentTimestamp = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' '); // 'YYYY-MM-DD HH:mm:ss' 형식
};
