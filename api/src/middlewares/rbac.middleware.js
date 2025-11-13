import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";

const checkPermission = (allowedRoles) => {
    return (req, res, next) => {
        // Input validation (professional touch)
        if (!allowedRoles || allowedRoles.length === 0) {
            return next({
                status: HttpResponseCode.BAD_REQUEST,
                message: "Route configuration error: No roles specified",
                statusCode: HttpResponse.validationFailed
            });
        }

        if (!Array.isArray(allowedRoles)) {
            return next({
                status: HttpResponseCode.BAD_REQUEST, 
                message: "Route configuration error: Roles must be an array",
                statusCode: HttpResponse.validationFailed
            });
        }

        // Check authentication
        if (!req.loggedInUser) {
            return next({
                status: HttpResponseCode.UNAUTHENTICATED,
                message: "Authentication required",
                statusCode: HttpResponse.unauthenticated
            });
        }

        const userRole = req.loggedInUser.role;

        // Check permission with better error message
        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            next({
                status: HttpResponseCode.FORBIDDEN,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                statusCode: HttpResponse.accessDenied,
                meta: {
                    requiredRoles: allowedRoles,
                    userRole: userRole
                }
            });
        }
    };
};

// Professional shortcut methods
const Require = {
    Admin: checkPermission(['admin']),
    Teacher: checkPermission(['teacher']),
    Student: checkPermission(['student']),
    AdminOrTeacher: checkPermission(['admin', 'teacher']),
    Any: checkPermission(['admin', 'teacher', 'student'])
};

export { checkPermission, Require };