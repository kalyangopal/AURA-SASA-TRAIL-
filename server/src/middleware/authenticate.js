import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function authenticate(req,res,next){
  try{
    const token=req.cookies.aura_token;
    if(!token) return res.status(401).json({message:"Authentication required"});
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    const user=await User.findById(decoded.userId).select("-passwordHash");
    if(!user||user.status!=="active") return res.status(401).json({message:"Invalid session"});
    req.user=user; req.tenantId=user.tenantId; next();
  }catch(e){return res.status(401).json({message:"Invalid session"});}
}