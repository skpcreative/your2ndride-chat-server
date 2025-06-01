const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Allow specific origins in production, or any origin in development
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.CLIENT_URL || 'https://your2ndride.vercel.app'] 
      : '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    // Make sure the message has an ID
    if (!message.id) {
      message.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Broadcast the message to all clients in the room (including sender)
    io.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
