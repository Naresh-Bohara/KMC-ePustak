//global route

import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import facultyRouter from "../modules/faculty/faculty.router.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/faculties", facultyRouter);


export default router;