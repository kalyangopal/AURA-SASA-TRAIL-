import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
export async function list(req,res){res.json(await Member.find({tenantId:req.tenantId}).sort({createdAt:-1}));}
export async function create(req,res){
  const m=await Member.create({...req.body,tenantId:req.tenantId});
  if(Number(m.paid)>0) await Payment.create({tenantId:req.tenantId,memberId:m._id,amount:m.paid,date:m.startDate,method:m.method,note:"Initial membership payment"});
  res.status(201).json(m);
}
export async function update(req,res){
  const m=await Member.findOneAndUpdate({_id:req.params.id,tenantId:req.tenantId},req.body,{new:true,runValidators:true});
  if(!m)return res.status(404).json({message:"Member not found"});res.json(m);
}
export async function remove(req,res){
  const m=await Member.findOneAndDelete({_id:req.params.id,tenantId:req.tenantId});
  if(!m)return res.status(404).json({message:"Member not found"});
  await Payment.deleteMany({tenantId:req.tenantId,memberId:m._id});res.json({message:"Member deleted"});
}