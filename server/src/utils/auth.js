import jwt from "jsonwebtoken";
export function signUser(user){return jwt.sign({userId:user._id.toString(),tenantId:user.tenantId.toString(),role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});}
export function safeUser(u){return {_id:u._id,name:u.name,email:u.email,role:u.role,tenantId:u.tenantId};}