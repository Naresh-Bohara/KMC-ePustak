import { Router } from "express";
import { queryValidator } from "../../middlewares/request-validator.middleware.js";
import { dashboardQueryDTO, teacherMaterialsDTO } from "./dashboard.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import dashboardCtrl from "./dashboard.controller.js";


const dashboardRouter = Router();

// ADMIN DASHBOARD
dashboardRouter.get("/admin/stats", checkLogin, Require.Admin, dashboardCtrl.getAdminStats);
dashboardRouter.get("/admin/activities", checkLogin, Require.Admin, dashboardCtrl.getAdminActivities);
dashboardRouter.get("/admin/faculty-analytics", checkLogin, Require.Admin, dashboardCtrl.getFacultyAnalytics);

// TEACHER DASHBOARD 
dashboardRouter.get("/teacher/stats", checkLogin, Require.Teacher, dashboardCtrl.getTeacherStats);
dashboardRouter.get("/teacher/materials", checkLogin, Require.Teacher, queryValidator(teacherMaterialsDTO), dashboardCtrl.getTeacherMaterials);
dashboardRouter.get("/teacher/performance", checkLogin, Require.Teacher, dashboardCtrl.getTeacherPerformance);

// STUDENT DASHBOARD 
dashboardRouter.get("/student/overview", checkLogin, dashboardCtrl.getStudentOverview);
dashboardRouter.get("/student/recent-materials", checkLogin, dashboardCtrl.getStudentRecentMaterials);

// COMMON DASHBOARD
dashboardRouter.get("/recent-activities", checkLogin, dashboardCtrl.getRecentActivities);
dashboardRouter.get("/popular-materials", checkLogin, queryValidator(dashboardQueryDTO), dashboardCtrl.getPopularMaterials);

export default dashboardRouter;