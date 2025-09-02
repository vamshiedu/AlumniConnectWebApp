import mongoose from 'mongoose';

const postSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    post:{
        type:String,
        required:true,
        trim:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    image:{
        id:String,
        url:String
    },
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    comments:[
        {
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "User" 
            },
            comment:{
                type:String,
                required:true
            },
            createdAt:{
                type:Date,
                default:Date.now
            }
        }
    ]
},{
    timestamps:true
});

export const Post=mongoose.model("Post",postSchema);