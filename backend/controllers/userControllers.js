import User from '../models/userModel.js'
import generateToken from '../utils/generateToken.js';
import TryCatch from '../utils/TryCatch.js'
import bcrypt from 'bcrypt'

export const registerUser=TryCatch(async(req,res)=>{
    const {name,email,rollNumber,role,batch,password,department,currentEmploymentStatus}=req.body;
    let user=await User.findOne({email});
    if(user)
        return res.status(400).json({
        message:"User with the same email exists"
    });
    const hashPassword=await bcrypt.hash(password,10);
    user=await User.create({
        name,email,rollNumber,role,batch,password:hashPassword,department,currentEmploymentStatus
    });
    console.log(!user);
    const token = generateToken(user._id,res);
    res.status(200).json({
        message:"Registered Successfully",
        token : token
    });
    return res;
});

export const loginUser=TryCatch(async(req,res,next)=>{
    const {email,password}=req.body;
    let user=await User.findOne({email})
        .populate("followers","name avatar department batch role")
        .populate("following","name avatar department batch role");
    console.log(req.body);
    if(!user)
    {
        return res.status(400).json({
            message:"No user with this mail"
        });
    }
    const comparePassword=await bcrypt.compare(password,user.password);
    if(!comparePassword)
    {
        res.status(400).json({
            message:"Wrong Password, Please Try Again"
        });
    }
    const {password:pass,...rest}=user._doc;
    const token = generateToken(user._id,res);
    res.status(200).json({
        user:rest,
        message:"Login Successful",
        token : token
    });
    console.log(res.status);
    return res;
});

export const getAllUsers=TryCatch(async(req,res)=>{
    const search=req.query.search||"";
    const users=await User.find({
        _id:{$ne:req.user._id},
        name:{$regex:search,$options:"i"}
    })
        .select("name avatar role department batch currentEmploymentStatus")
        .sort({name:1})
        .limit(30)
        .lean();
    res.json(users);
});

export const myProfile=TryCatch(async(req,res)=>{
    const user=await User.findById(req.user._id)
        .select("-password")
        .populate("followers","name avatar department batch role")
        .populate("following","name avatar department batch role")
        .lean();
    res.json(user);
});

// Return the accounts the logged-in user follows (used to start conversations).
export const getFollowing=TryCatch(async(req,res)=>{
    const search=(req.query.search||"").trim();
    const me=await User.findById(req.user._id)
        .select("following")
        .populate({
            path:"following",
            select:"name avatar role department batch",
            ...(search?{match:{name:{$regex:search,$options:"i"}}}:{})
        })
        .lean();
    const following=(me?.following||[]).filter(Boolean);
    res.json(following);
});

export const userProfile=TryCatch(async(req,res)=>{
    // Public view: only expose non-private fields (name, batch, branch, skills,
    // avatar/cover, bio, follow counts). Projects, about and endorsement details
    // stay private for other users.
    const user=await User.findById(req.params.id)
        .select("name role batch department avatar coverImage bio currentEmploymentStatus createdAt skills followers following")
        .lean();
    if(!user)
    {
        return res.status(404).json({
            message:"User not found"
        });
    }
    const publicUser={
        _id:user._id,
        name:user.name,
        role:user.role,
        batch:user.batch,
        department:user.department,
        avatar:user.avatar,
        coverImage:user.coverImage,
        bio:user.bio,
        currentEmploymentStatus:user.currentEmploymentStatus,
        createdAt:user.createdAt,
        // Skills are public but expose only the name and endorsement count.
        skills:(user.skills||[]).map((s)=>({
            name:s.name,
            endorsements:(s.endorsedBy||[]).length,
            endorsedByMe:(s.endorsedBy||[]).some((f)=>f.toString()===req.user._id.toString())
        })),
        followers:(user.followers||[]).map((f)=>f.toString()),
        following:(user.following||[]).map((f)=>f.toString())
    };
    res.json(publicUser);
});

export const updateProfile=TryCatch(async(req,res)=>{
    const {bio,about,location,avatar,coverImage,skills,projects}=req.body;
    const user=await User.findById(req.user._id).select("-password");
    if(!user)
    {
        return res.status(404).json({
            message:"User not found"
        });
    }
    // Only editable fields are updated. Name, batch, department, roll number,
    // role and email remain read-only and are never touched here.
    if(bio!==undefined) user.bio=bio;
    if(about!==undefined) user.about=about;
    if(location!==undefined) user.location=location;
    if(avatar!==undefined) user.avatar=avatar;
    if(coverImage!==undefined) user.coverImage=coverImage;

    if(Array.isArray(skills))
    {
        // Preserve existing endorsements when the owner renames/reorders skills.
        const existing=new Map((user.skills||[]).map((s)=>[s.name.toLowerCase(),s.endorsedBy||[]]));
        user.skills=skills
            .map((s)=>(typeof s==="string"?s:s?.name))
            .filter((name)=>name&&name.trim())
            .map((name)=>({
                name:name.trim(),
                endorsedBy:existing.get(name.trim().toLowerCase())||[]
            }));
    }

    if(Array.isArray(projects))
    {
        user.projects=projects.map((p)=>({
            title:p.title||"",
            description:p.description||"",
            tags:Array.isArray(p.tags)?p.tags.filter(Boolean):[],
            status:p.status||"Live",
            link:p.link||""
        }));
    }

    await user.save();
    const updated=await User.findById(user._id)
        .select("-password")
        .populate("followers","name avatar department batch role")
        .populate("following","name avatar department batch role")
        .lean();
    res.json({
        message:"Profile updated successfully",
        user:updated
    });
});

export const endorseSkill=TryCatch(async(req,res)=>{
    const {skillName}=req.body;
    const user=await User.findById(req.params.id).select("-password");
    if(!user)
    {
        return res.status(404).json({
            message:"User not found"
        });
    }
    if(user._id.toString()===req.user._id.toString())
    {
        return res.status(400).json({
            message:"You cannot endorse your own skills"
        });
    }
    const skill=(user.skills||[]).find((s)=>s.name.toLowerCase()===String(skillName||"").toLowerCase());
    if(!skill)
    {
        return res.status(404).json({
            message:"Skill not found"
        });
    }
    const idx=skill.endorsedBy.findIndex((f)=>f.toString()===req.user._id.toString());
    if(idx>=0)
    {
        skill.endorsedBy.splice(idx,1);
    }
    else
    {
        skill.endorsedBy.push(req.user._id);
    }
    await user.save();
    res.json({
        message:idx>=0?"Endorsement removed":"Skill endorsed",
        endorsements:skill.endorsedBy.length,
        endorsedByMe:idx<0
    });
});

export const followAndUnfollowUser=TryCatch(async(req,res)=>{
    const user=await User.findById(req.params.id).select("-password");
    const loggedUser=await User.findById(req.user._id).select("-password");
    if(!user)
    {
        return res.status(400).json({
            message:"Cannot find the user mentioned"
        });
    }
    if(loggedUser._id.toString()===user._id.toString())
    {
        return res.status(400).json({
            message:"You cannot follow yourself"
        });
    }
    if(user.followers.includes(loggedUser._id))
    {
        let followingIndex=loggedUser.following.indexOf(user._id);
        let followerIndex=user.followers.indexOf(loggedUser._id);
        loggedUser.following.splice(followingIndex,1);
        user.followers.splice(followerIndex,1);
        await loggedUser.save();
        await user.save();
        res.json({
            message:"User Unfollowed"
        });
    }
    else
    {
        loggedUser.following.push(user._id);
        user.followers.push(loggedUser._id);
        await loggedUser.save();
        await user.save();
        res.json({
            message:"User Followed"
        });
    }
});

export const logoutUser=TryCatch(async(req,res)=>{
    res.cookie("token","",{maxAge:0});
    res.json({
        message:"Logged Out Successfully"
    });
});

