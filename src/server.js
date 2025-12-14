// src/server.js
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { pool } from "./config/db.js";

// New imports for Socket.IO
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = process.env.PORT || 5000;

// Create an HTTP server from the Express app
const httpServer = createServer(app);

// Initialize Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, you should restrict this to your frontend's domain
    methods: ["GET", "POST"]
  }
});

// Make the io instance available to the rest of the app (for controllers)
app.set('io', io);

// Socket.IO middleware for authenticating users with JWT
io.use((socket, next) => {
    // Client should send token in the `auth` object during connection
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error: Token not provided"));
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
        // Attach user ID from the token payload to the socket object
        socket.userId = decoded.id; 
        next();
    });
});

// Handle new Socket.IO connections
io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // If authentication was successful, the socket will have a userId
    if (socket.userId) {
        const userRoom = `user_${socket.userId}`;
        socket.join(userRoom);
        console.log(`✅ User ${socket.userId} with socket ${socket.id} joined room: ${userRoom}`);
    }

    socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
});

// Connect to the database and start the server
pool
  .connect()
  .then(() => {
    // Start the HTTP server (which includes Express and Socket.IO)
    httpServer.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO server is ready and listening for connections.`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  });