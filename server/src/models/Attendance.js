import mongoose from "mongoose";
const schema = new mongoose.Schema({
  tenantId:{type:mongoose.Schema.Types.ObjectId,ref:"Tenant",required:true,index:true},
  date:{type:String,required:true},records:{type:Map,of:String,default:{}}
},{timestamps:true});
schema.index({tenantId:1,date:1},{unique:true});
export default mongoose.model("Attendance",schema);