import express from 'express';
import dotenv from 'dotenv'
import connectDb from './database/db.js';
const app=express();

dotenv.config();
connectDb();
const port=process.env.PORT;
app.get("/",(req,res)=>{
    res.send("Hello");
});

app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});
