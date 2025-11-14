import { Router } from "express";

import { bodyValidator } from "../../middlewares/request-validator.middleware.js";
import { createCourseDTO, updateCourseDTO } from "./course.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import courseCtrl from "./course.controller.js";


const courseRouter = Router();

courseRouter.post("/", checkLogin, Require.Admin,bodyValidator(createCourseDTO), courseCtrl.createCourse);
courseRouter.put("/:id", checkLogin, Require.Admin, bodyValidator(updateCourseDTO), courseCtrl.updateCourse);
courseRouter.delete("/:id", checkLogin, Require.Admin, courseCtrl.deleteCourse);

// PUBLIC ROUTES (All authenticated users can view)
courseRouter.get("/", checkLogin, courseCtrl.getCourses);
courseRouter.get("/:id", checkLogin, courseCtrl.getCourseById);

export default courseRouter;