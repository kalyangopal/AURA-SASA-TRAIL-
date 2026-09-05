import {Router} from "express";import {dashboard} from "../controllers/reportController.js";
const r=Router();r.get("/dashboard",dashboard);export default r;