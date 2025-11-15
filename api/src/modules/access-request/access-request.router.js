import { Router } from "express";
import { bodyValidator, queryValidator } from "../../middlewares/request-validator.middleware.js";
import { 
  requestAccessDTO, 
  respondRequestDTO, 
  studentRequestsDTO,
  teacherRequestsDTO 
} from "./access-request.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import accessRequestCtrl from "./access-request.controller.js";

const accessRequestRouter = Router();

// STUDENT ROUTES 
// Student requests access to a request-based material
accessRequestRouter.post("/materials/:materialId/request", checkLogin, bodyValidator(requestAccessDTO), accessRequestCtrl.requestAccess);

// Student gets their access requests with filters and pagination
accessRequestRouter.get("/student/my-requests", checkLogin, queryValidator(studentRequestsDTO), accessRequestCtrl.getStudentRequests);

// Student cancels their pending request
accessRequestRouter.delete("/requests/:requestId/cancel", checkLogin, accessRequestCtrl.cancelRequest);

// TEACHER ROUTES
// Teacher gets pending access requests for their materials
accessRequestRouter.get("/teacher/pending-requests", checkLogin, Require.Teacher, queryValidator(teacherRequestsDTO), accessRequestCtrl.getTeacherPendingRequests);

// Teacher gets all access requests (pending, approved, rejected) for their materials
accessRequestRouter.get("/teacher/all-requests", checkLogin, Require.Teacher, queryValidator(teacherRequestsDTO), accessRequestCtrl.getTeacherAllRequests);

// Teacher approves/rejects an access request
accessRequestRouter.post("/requests/:requestId/respond", checkLogin, Require.Teacher, bodyValidator(respondRequestDTO), accessRequestCtrl.respondToRequest);

// COMMON ROUTES 
// Check if current user has access to a specific material
accessRequestRouter.get("/materials/:materialId/access-status", checkLogin, accessRequestCtrl.getAccessStatus);

// Get access request details by ID
accessRequestRouter.get("/requests/:requestId", checkLogin, accessRequestCtrl.getRequestById);

export default accessRequestRouter;