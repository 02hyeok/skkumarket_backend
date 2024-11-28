import { Server } from "socket.io";
import execQuery from "./utils/DButils.js"

const SAVE_MSG_SQL = `
    INSERT INTO ChatMessage (chat_id, sender_id, message) VALUES (?, ?, ?);
`;
const GET_USER_INFO = `
    SELECT nickname FROM User WHERE id = ?;
`;


const userMap = new Map(); // socket.id -> { chat_id, nickname }

export default (server) => {
    const io = new Server(server, { 
        path: "/socket.io",
        cors: {
            origin: "*" // Flutter 연결 허용
        }
    });

    io.on("connection", (socket) => {

        socket.on("joinRoom", async ({ ChatID, SenderID }) => {
            const userInfo = await execQuery(GET_USER_INFO, [SenderID]);
            console.log(`${userInfo[0].nickname} joined room: ${ChatID}`);
        
            userMap.set(socket.id, { chat_id: ChatID, sender_id: SenderID, nickname: userInfo[0].nickname });
            socket.join(ChatID);
            io.to(ChatID).emit("systemMessage", `${userInfo[0].nickname} has joined the room.`);
        });

        socket.on("msg", async (msg) => {
            const user = userMap.get(socket.id);
            if (user) {
                console.log(`[${user.chat_id}] ${user.nickname}: ${msg}`);
                socket.to(user.chat_id).emit("msg", { nickname: user.nickname, msg });

                await execQuery(SAVE_MSG_SQL, [user.chat_id, user.sender_id, msg]);
            }
        });

        socket.on("disconnect", () => {
            const user = userMap.get(socket.id);
            if (user) {
                console.log(`${user.nickname} left room: ${user.chat_id}`);

                io.to(user.chat_id).emit("systemMessage", `${user.nickname} has left the room.`);
                userMap.delete(socket.id);
            }
        });
    });
};