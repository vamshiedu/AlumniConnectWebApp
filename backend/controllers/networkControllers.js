import User from '../models/userModel.js'
import TryCatch from '../utils/TryCatch.js'

export const discoverPeople=TryCatch(async(req,res)=>{
    const users=await User.find({
        _id: { $ne: req.user._id }
    })
    .select("-password")
    .lean()
    .limit(20);
    res.json(users);
});

export const getFollowers=TryCatch(async(req,res)=>{
    const user=await User.findById(req.user._id)
        .select("-password")
        .populate("followers", "name avatar role department batch")
        .lean();
    res.json(user.followers);
});

export const getFollowing=TryCatch(async(req,res)=>{
    const user=await User.findById(req.user._id)
    .select("-password")
    .populate("following", "name avatar role department batch")
    .lean();
    res.json(user.following);
});

