import express from 'express';
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
    origin: 'http://localhost:3000',
    credentials: true
}));
// const allowedOrigins = [
//   'http://localhost:3000',
//   'http://localhost:5173',
//   'https://alumniconnect-coral.vercel.app',
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(cors({
//   origin: allowedOrigins,
//   credentials: true,
// }));

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

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
