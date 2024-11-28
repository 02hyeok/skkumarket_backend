import pool from "../config/db.js"
/*
  MySQL 쿼리 실행 라이브러리
  << Usage >>
   const val = await execQuery("SELECT * FRPOM Users WHERE UserID = ?", [12345]);
*/

async function execQuery(SQL, values) {

    let result = null;
    const connection = await pool.getConnection();
    try {
        if(values) {
            [ result ]= await connection.query(SQL, values);
        } else {
            [ result ]= await connection.query(SQL);
        }
    } catch(error) {
        console.error(error);
        connection.rollback();
    } finally {
        connection.release();
    }

    return result;
}

export default execQuery;