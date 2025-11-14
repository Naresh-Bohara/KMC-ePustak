import { Router } from "express";
import facultyCtrl from "./faculty.controller.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import { createFacultyDTO, updateFacultyDTO } from "./faculty.request.js";
import { bodyValidator } from "../../middlewares/request-validator.middleware.js";

const facultyRouter = Router();

facultyRouter.post("/", checkLogin, Require.Admin, bodyValidator(createFacultyDTO), facultyCtrl.createFaculty);
facultyRouter.put("/:id", checkLogin, Require.Admin, bodyValidator(updateFacultyDTO), facultyCtrl.updateFaculty);
facultyRouter.delete("/:id", checkLogin, Require.Admin, facultyCtrl.deleteFaculty);

facultyRouter.get("/", checkLogin, facultyCtrl.getFaculties);
facultyRouter.get("/:id", checkLogin, facultyCtrl.getFacultyById);

export default facultyRouter;