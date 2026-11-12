import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import connectDb from './database/db.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import cloudinary from 'cloudinary';
import cors from 'cors';
import networkRoutes from './routes/networkRoutes.js'

dotenv.config({ path: './backend/.env' });
const app=express();

app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://alumniconnect-coral.vercel.app',
    ],
    credentials: true
}));

connectDb();
cloudinary.v2.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_SECRET,
});
app.use(express.json());
app.use(cookieParser());
app.use("/api/user",userRoutes);
app.use("/api/post",postRoutes);
app.use("/api/message",messageRoutes);
app.use("/api/event",eventRoutes);
app.use("/api/network",networkRoutes);
const port=process.env.PORT;
app.get("/",(req,res)=>{
    res.send("Hello");
});

// Real-time layer: expose Socket.IO so controllers can push live updates.
const httpServer=http.createServer(app);
const io=new Server(httpServer,{
    cors:{
        origin:[
            'http://localhost:3000',
            'https://alumniconnect-coral.vercel.app',
        ],
        credentials:true
    }
});

// Authenticate each socket with the same JWT used for the REST API.
io.use((socket,next)=>{
    try{
        const token=socket.handshake.auth?.token;
        if(!token) return next(new Error("No token"));
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        socket.userId=decoded.id;
        next();
    }catch(err){
        next(new Error("Authentication failed"));
    }
});

io.on("connection",(socket)=>{
    // Each user joins a private room so we can target all of their devices.
    socket.join(`user:${socket.userId}`);
    socket.on("disconnect",()=>{});
});

// Make io available to route handlers via req.app.get('io').
app.set("io",io);

httpServer.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
