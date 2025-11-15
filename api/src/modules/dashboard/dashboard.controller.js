
import HttpResponse from "../../constants/response-status.contants.js";
import dashboardSvc from "./dashboard.service.js";


class DashboardController {
    
    // ADMIN DASHBOARD
    
    getAdminStats = async (req, res, next) => {
        try {
            const stats = await dashboardSvc.getAdminStats();
            
            res.json({
                data: stats,
                message: "Admin statistics retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getAdminActivities = async (req, res, next) => {
        try {
            const activities = await dashboardSvc.getAdminActivities();
            
            res.json({
                data: activities,
                message: "Recent activities retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getFacultyAnalytics = async (req, res, next) => {
        try {
            const analytics = await dashboardSvc.getFacultyAnalytics();
            
            res.json({
                data: analytics,
                message: "Faculty analytics retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // TEACHER DASHBOARD 
    
    getTeacherStats = async (req, res, next) => {
        try {
            const stats = await dashboardSvc.getTeacherStats(req.loggedInUser._id);
            
            res.json({
                data: stats,
                message: "Teacher statistics retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getTeacherMaterials = async (req, res, next) => {
        try {
            const result = await dashboardSvc.getTeacherMaterials(
                req.loggedInUser._id, 
                req.query
            );
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: result.materials.length > 0 
                    ? "Teacher materials retrieved successfully" 
                    : "No materials found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getTeacherPerformance = async (req, res, next) => {
        try {
            const performance = await dashboardSvc.getTeacherPerformance(req.loggedInUser._id);
            
            res.json({
                data: performance,
                message: "Teacher performance analytics retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // STUDENT DASHBOAR
    
    getStudentOverview = async (req, res, next) => {
        try {
            const overview = await dashboardSvc.getStudentOverview(req.loggedInUser._id);
            
            res.json({
                data: overview,
                message: "Student overview retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getStudentRecentMaterials = async (req, res, next) => {
        try {
            const materials = await dashboardSvc.getStudentRecentMaterials(req.loggedInUser._id);
            
            res.json({
                data: materials,
                message: "Recent materials retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // COMMON DASHBOARD 
    
    getRecentActivities = async (req, res, next) => {
        try {
            const activities = await dashboardSvc.getRecentActivities();
            
            res.json({
                data: activities,
                message: "Recent platform activities retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getPopularMaterials = async (req, res, next) => {
        try {
            const result = await dashboardSvc.getPopularMaterials(req.query);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: result.materials.length > 0 
                    ? "Popular materials retrieved successfully" 
                    : "No popular materials found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const dashboardCtrl = new DashboardController();
export default dashboardCtrl;