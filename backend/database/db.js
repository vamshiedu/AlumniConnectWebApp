import mongoose from 'mongoose';

const connectDb=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL,{
            dbName:"alumni"
        });
        console.log('Connection to DB successful');
    }
    catch(err)
    {
        console.log(err);
        process.exit(1);
    }
}

export default connectDb;