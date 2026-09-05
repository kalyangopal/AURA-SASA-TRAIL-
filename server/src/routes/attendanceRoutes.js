import { Router } from "express";
import { list, get, save } from "../controllers/attendanceController.js";

const r = Router();
r.get("/", list);
r.get("/:date", get);
r.put("/:date", save);

export default r;
