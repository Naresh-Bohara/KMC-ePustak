//global route

import { Router } from "express";
import authRouter from "../modules/auth/auth.router.js";
import facultyRouter from "../modules/faculty/faculty.router.js";
import courseRouter from "../modules/course/course.router.js";
import materialRouter from "../modules/material/material.router.js";
import searchRouter from "../modules/search/search.router.js";
import bookmarkRouter from "../modules/bookmark/bookmark.router.js";
import dashboardRouter from "../modules/dashboard/dashboard.router.js";
import accessRequestRouter from "../modules/access-request/access-request.router.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/faculties", facultyRouter);
router.use("/courses", courseRouter);
router.use("/materials", materialRouter);
router.use("/search", searchRouter);
router.use("/bookmarks", bookmarkRouter);
router.use("/dashboard", dashboardRouter);
router.use("/access-requests", accessRequestRouter);


export default router;