import bcrypt from "bcryptjs";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import {signUser,safeUser} from "../utils/auth.js";

export async function register(req,res){
  const {gymName,ownerName,email,phone,password}=req.body;
  if(!gymName||!ownerName||!email||!password) return res.status(400).json({message:"Gym name, owner name, email and password are required"});
  if(await User.exists({email:email.toLowerCase()})) return res.status(409).json({message:"Email already registered"});
  const tenant=await Tenant.create({gymName,ownerName,email,phone});
  const passwordHash=await bcrypt.hash(password,12);
  const user=await User.create({tenantId:tenant._id,name:ownerName,email,passwordHash,role:"owner"});
  res.cookie("aura_token",signUser(user),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:7*24*60*60*1000});
  res.status(201).json({user:safeUser(user),tenant});
}
export async function login(req,res){
  const {email,password}=req.body;
  const user=await User.findOne({email:email?.toLowerCase()});
  if(!user||!(await bcrypt.compare(password||"",user.passwordHash))) return res.status(401).json({message:"Invalid email or password"});
  if(user.status!=="active") return res.status(403).json({message:"Account inactive"});
  const tenant=await Tenant.findById(user.tenantId);
  res.cookie("aura_token",signUser(user),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:7*24*60*60*1000});
  res.json({user:safeUser(user),tenant});
}
export async function logout(req,res){res.clearCookie("aura_token");res.json({message:"Logged out"});}
export async function me(req,res){const tenant=await Tenant.findById(req.user.tenantId);res.json({user:safeUser(req.user),tenant});}