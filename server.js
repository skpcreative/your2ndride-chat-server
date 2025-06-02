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

// Store active users and their rooms
const activeUsers = new Map();
const userRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register user with their ID
  socket.on("registerUser", (userId) => {
    if (userId) {
      activeUsers.set(socket.id, userId);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    
    // Track which rooms this socket is in
    if (!userRooms.has(socket.id)) {
      userRooms.set(socket.id, new Set());
    }
    userRooms.get(socket.id).add(roomId);
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    
    // Remove room from tracking
    if (userRooms.has(socket.id)) {
      userRooms.get(socket.id).delete(roomId);
    }
    
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on("sendMessage", ({ roomId, message }) => {
    console.log(`Message received in room ${roomId}:`, message);
    
    // Broadcast to all clients in the room except the sender
    socket.to(roomId).emit("receiveMessage", message);
    
    // Extract recipient ID and listing ID from room ID (format: listing_[listingId]_[userId1]_[userId2])
    const roomParts = roomId.split('_');
    if (roomParts.length >= 4) {
      const listingId = roomParts[1];
      const userIds = [roomParts[2], roomParts[3]];
      const recipientId = userIds.find(id => id !== message.sender);
      
      if (recipientId) {
        // Find if recipient is connected and in which socket
        const recipientSocketId = [...activeUsers.entries()]
          .find(([socketId, userId]) => userId === recipientId)?.[0];
        
        if (recipientSocketId) {
          // Check if recipient is in this room
          const recipientRooms = userRooms.get(recipientSocketId);
          if (!recipientRooms || !recipientRooms.has(roomId)) {
            // Recipient is not in this room, send notification
            io.to(recipientSocketId).emit("newMessageNotification", {
              roomId,
              senderId: message.sender,
              senderName: message.senderName,
              recipientId,
              content: message.content,
              timestamp: message.timestamp,
              listingId: listingId
            });
          }
        } else {
          // Recipient is not connected, we could store the notification for later
          console.log(`Recipient ${recipientId} is not connected. Message will be seen when they connect.`);
        }
      }
    }
  });

  socket.on("disconnect", () => {
    // Clean up user tracking
    activeUsers.delete(socket.id);
    userRooms.delete(socket.id);
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Your2ndRide Chat Server running on port ${PORT}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});
