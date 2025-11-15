
import HttpResponse from "../../constants/response-status.contants.js";
import accessRequestSvc from "./access-request.service.js";

class AccessRequestController {
    
    // STUDENT ROUTES 
    requestAccess = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.requestAccess(
                req.params.materialId,
                req.loggedInUser._id,
                req.body.requestMessage
            );
            
            res.status(201).json({
                data: result.request,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getStudentRequests = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.getStudentRequests(
                req.loggedInUser._id,
                req.query
            );
            
            res.json({
                data: result.requests,
                pagination: result.pagination,
                message: result.requests.length > 0 
                    ? "Access requests retrieved successfully" 
                    : "No access requests found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    cancelRequest = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.cancelRequest(
                req.params.requestId,
                req.loggedInUser._id
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

    // TEACHER ROUTES 

    getTeacherPendingRequests = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.getTeacherRequests(
                req.loggedInUser._id,
                { ...req.query, status: 'pending' }
            );
            
            res.json({
                data: result.requests,
                pagination: result.pagination,
                message: result.requests.length > 0 
                    ? "Pending access requests retrieved successfully" 
                    : "No pending access requests found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getTeacherAllRequests = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.getTeacherRequests(
                req.loggedInUser._id,
                req.query
            );
            
            res.json({
                data: result.requests,
                pagination: result.pagination,
                message: result.requests.length > 0 
                    ? "All access requests retrieved successfully" 
                    : "No access requests found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    respondToRequest = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.respondToRequest(
                req.params.requestId,
                req.loggedInUser._id,
                req.body
            );
            
            res.json({
                data: result.request,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // COMMON ROUTES 

    getAccessStatus = async (req, res, next) => {
        try {
            const result = await accessRequestSvc.getAccessStatus(
                req.params.materialId,
                req.loggedInUser._id,
                req.query.includeRequestDetails
            );
            
            res.json({
                data: result,
                message: result.hasAccess 
                    ? "Access granted to this material" 
                    : result.requestStatus === 'pending'
                    ? "Access request pending approval"
                    : result.requestStatus === 'rejected'
                    ? "Access request was rejected"
                    : "Access not requested yet",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getRequestById = async (req, res, next) => {
        try {
            const request = await accessRequestSvc.getRequestById(
                req.params.requestId,
                req.loggedInUser._id,
                req.loggedInUser.role
            );
            
            res.json({
                data: request,
                message: "Access request details retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const accessRequestCtrl = new AccessRequestController();
export default accessRequestCtrl;