import mongoose from "mongoose";
const schema = new mongoose.Schema({
  tenantId:{type:mongoose.Schema.Types.ObjectId,ref:"Tenant",required:true,index:true},
  name:{type:String,required:true,trim:true},
  phone:{type:String,required:true,trim:true},
  gender:String,dob:String,plan:{type:String,required:true},
  amount:{type:Number,required:true,min:0},paid:{type:Number,default:0,min:0},
  method:{type:String,default:"Cash"},startDate:{type:String,required:true},
  endDate:{type:String,required:true},address:String
},{timestamps:true});
schema.index({tenantId:1,endDate:1});
export default mongoose.model("Member",schema);