import HttpResponse from "../../constants/response-status.contants.js";
import adminSvc from "./admin.service.js";

class AdminController {
    
    deleteUser = async (req, res, next) => {
        try {
            const result = await adminSvc.deleteUser(
                req.body.userId,
                req.loggedInUser._id,
                req.body.reason
            );
            
            res.json({
                data: result,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    changeUserStatus = async (req, res, next) => {
        try {
            const result = await adminSvc.changeUserStatus(
                req.body.userId,
                req.body.status,
                req.loggedInUser._id,
                req.body.reason
            );
            
            res.json({
                data: result,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getStudents = async (req, res, next) => {
        try {
            const result = await adminSvc.getUsersByRole('student', req.query);
            
            res.json({
                data: result.users,
                pagination: result.pagination,
                message: result.users.length > 0 
                    ? "Students retrieved successfully" 
                    : "No students found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getTeachers = async (req, res, next) => {
        try {
            const result = await adminSvc.getUsersByRole('teacher', req.query);
            
            res.json({
                data: result.users,
                pagination: result.pagination,
                message: result.users.length > 0 
                    ? "Teachers retrieved successfully" 
                    : "No teachers found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const adminCtrl = new AdminController();
export default adminCtrl;