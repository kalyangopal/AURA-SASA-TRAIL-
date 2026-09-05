import mongoose from "mongoose";
const schema = new mongoose.Schema({
  tenantId:{type:mongoose.Schema.Types.ObjectId,ref:"Tenant",required:true,index:true},
  memberId:{type:mongoose.Schema.Types.ObjectId,ref:"Member",required:true,index:true},
  amount:{type:Number,required:true,min:0},
  date:{type:String,required:true},method:{type:String,default:"Cash"},note:String
},{timestamps:true});
schema.index({tenantId:1,date:-1});
export default mongoose.model("Payment",schema);