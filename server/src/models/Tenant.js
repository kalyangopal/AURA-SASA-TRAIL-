import mongoose from "mongoose";
const schema = new mongoose.Schema({
  gymName:{type:String,required:true,trim:true},
  ownerName:{type:String,required:true,trim:true},
  phone:{type:String,trim:true},
  email:{type:String,trim:true,lowercase:true},
  address:{type:String,trim:true},
  currency:{type:String,default:"₹"},
  dateFormat:{type:String,default:"DD/MM/YYYY"},
  plan:{type:String,default:"Basic"},
  subscriptionStatus:{type:String,default:"active"},
  createdAt:{type:Date,default:Date.now}
},{timestamps:true});
export default mongoose.model("Tenant",schema);