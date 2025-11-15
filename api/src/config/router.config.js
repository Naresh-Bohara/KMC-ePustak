//global route

import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import facultyRouter from "../modules/faculty/faculty.router.js";
import courseRouter from "../modules/course/course.router.js";
import materialRouter from "../modules/material/material.router.js";
const router = Router();

router.use("/auth", authRouter);
router.use("/faculties", facultyRouter);
router.use("/courses", courseRouter);
router.use("/materials", materialRouter);

export default router;