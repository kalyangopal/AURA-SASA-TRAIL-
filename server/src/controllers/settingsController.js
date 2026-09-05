import Tenant from "../models/Tenant.js";
export async function get(req,res){res.json(await Tenant.findById(req.tenantId));}
export async function update(req,res){
 const allowed=["gymName","ownerName","phone","email","address","currency","dateFormat"];
 const data={};allowed.forEach(k=>{if(k in req.body)data[k]=req.body[k]});
 res.json(await Tenant.findByIdAndUpdate(req.tenantId,data,{new:true,runValidators:true}));
}