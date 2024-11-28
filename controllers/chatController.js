// 채팅 컨트롤러
import { Server } from "socket.io";
import chatModel from '../models/chatModel.js';

// 채팅방 생성 컨트롤러
export const createChatController = async (req, res) => {
    const { product_id, seller_id, buyer_id } = req.body;

    if(!product_id || !seller_id || !buyer_id) {
        res.status(404).json({ message: 'product ID, seller ID and buyer ID are required' });
    }

    try {
        const chatID = await chatModel.createChat(product_id, seller_id, buyer_id);
        res.status(200).json({ chatID, message: 'Chat room created successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// 특정 채팅방 조회 컨트롤러
export const getChatController = async (req, res) => {
    const { chat_id } = req.params;

    if(!chat_id) {
        res.status(404).json({ message: 'char ID is required' });
    }

    try {
        const chat = await chatModel.getChat(chat_id);
        if (!chat) {
            return res.status(404).json({ message: 'Chat room not found' });
        }
        res.status(200).json(chat);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// 모든 채팅방 조회 컨트롤러
export const getAllChatsController = async (req, res) => {
    const { user_id } = req.params;

    if(!user_id) {
        res.status(404).json({ message: 'user ID is required' });
    }

    try {
        const chats = await chatModel.getAllChats(user_id);
        res.status(200).json(chats);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// 메시지 추가 컨트롤러
export const addMessageController = async (req, res) => {
    const { chat_id } = req.params;
    const { sender_id, message } = req.body;

    if(!chat_id || !sender_id || !message) {
        res.status(404).json({ message: 'chat ID, sender ID and message are required' });
    }

    try {
        const messageID = await chatModel.addMessage(chat_id, sender_id, message);
        res.status(200).json({ messageID, message: 'Message added successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};
  
// 채팅방의 모든 채팅 불러오기
export const getMessagesController = async (req, res) => {
    const { chat_id } = req.params;
    
    if(!chat_id) {
        res.status(404).json({ message: 'chat ID is required' });
    }

    try {
        const messages = await chatModel.getMessages(chat_id);
        res.status(200).json(messages);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

// Socket.io와 통신
export const socket = async (server) => {
    const io = new Server(server, { 
        path: "/socket.io",
        cors: {
            origin: "*" // Flutter 연결 허용
        }
    });

    io.on("connection", (socket) => {

        const userState = {
            currentRoom: null, // 현재 사용자가 속한 채팅방
        };

        socket.on("joinRoom", async ({ chatID }) => {
            try {
                const chat = await chatModel.getChat(chatID);
                if (!chat) {
                    return socket.emit('error', { message: 'Chat room not found' });
                }

                if (userState.currentRoom) {
                    // 기존 채팅방 떠나기
                    socket.leave(userState.currentRoom);
                    console.log(`User ${socket.id} left room: ${userState.currentRoom}`);
                }
                
                userState.currentRoom = chatID;
                socket.join(chatID); // Socket.IO 룸에 참가
                console.log(`User ${socket.id} joined room: ${chatID}`);
        
                // 기존 메시지를 클라이언트에 전송
                const messages = await chatModel.getMessages(chatID);
                socket.emit('previousMessages', messages);
            } catch (error) {
                console.error(error);
                socket.emit('error', { message: 'Error joining room' });
            }        
        });

        socket.on('sendMessage', async ({ chatID, sender_id, message }) => {
            try {
                // 메시지 저장
                const messageID = await chatModel.addMessage(chatID, sender_id, message);
        
                // 저장된 메시지를 브로드캐스트
                const savedMessage = {
                    id: messageID,
                    chat_id: chatID,
                    sender_id,
                    message,
                    send_at: new Date(),
                };
                io.to(chatID).emit('newMessage', savedMessage);
                console.log(`Message sent to room ${chatID}:`, savedMessage);
            } catch (error) {
                console.error(error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });
};