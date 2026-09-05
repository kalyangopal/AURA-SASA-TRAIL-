import {Router} from "express";import {list,create} from "../controllers/paymentController.js";
const r=Router();r.get("/",list);r.post("/",create);export default r;