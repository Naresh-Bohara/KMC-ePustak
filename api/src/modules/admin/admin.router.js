import { Router } from "express";
import { bodyValidator, queryValidator } from "../../middlewares/request-validator.middleware.js";
import { 
  deleteUserDTO, 
  changeUserStatusDTO 
} from "./admin.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import adminCtrl from "./admin.controller.js";

const adminRouter = Router();

// USER MANAGEMENT 
// Delete user (student/teacher)
adminRouter.post("/users/delete", checkLogin, Require.Admin, bodyValidator(deleteUserDTO), adminCtrl.deleteUser);

// Change user status (active/inactive/suspended)
adminRouter.post("/users/status", checkLogin, Require.Admin, bodyValidator(changeUserStatusDTO), adminCtrl.changeUserStatus);

// Get all students with filters
adminRouter.get("/students", checkLogin, Require.Admin, adminCtrl.getStudents);

// Get all teachers with filters
adminRouter.get("/teachers", checkLogin, Require.Admin, adminCtrl.getTeachers);

export default adminRouter;