import mongoose from "mongoose";
const schema = new mongoose.Schema({
  tenantId:{type:mongoose.Schema.Types.ObjectId,ref:"Tenant",required:true,index:true},
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  role:{type:String,enum:["owner","staff","superadmin"],default:"owner"},
  status:{type:String,enum:["active","inactive"],default:"active"}
},{timestamps:true});
export default mongoose.model("User",schema);