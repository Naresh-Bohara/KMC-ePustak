import jwt from "jsonwebtoken";
const { TokenExpiredError, JsonWebTokenError } = jwt;
import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";
import authSvc from "../modules/auth/auth.service.js";

const checkLogin = async (req, res, next) => {
    try {
        let token = req.headers['authorization'] || null;
        
        if (!token) {
            throw {
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Please login first.", 
                statusCode: HttpResponse.unauthenticated
            }
        }
        
        token = token.split(" ").pop();

        // Decode and verify token
        const data = jwt.verify(token, process.env.JWT_SECRET);

        const user = await authSvc.getUserByFilter({
            _id: data.sub
        });

        // Check if user is active
        if (user.status !== "active") {
            throw {
                status: HttpResponseCode.UNAUTHENTICATED,
                message: "Account is not active.",
                statusCode: HttpResponse.user.notActivate
            }
        }

        // 👇 BASE USER DATA
        const loggedInUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage,
            status: user.status
        };

        // 👇 ADD ROLE-SPECIFIC PROFILES
        if (user.role === 'student' && user.studentProfile) {
            loggedInUser.studentProfile = user.studentProfile;
        } else if (user.role === 'teacher' && user.teacherProfile) {
            loggedInUser.teacherProfile = user.teacherProfile;
        }
        // Admin doesn't need any profile

        req.loggedInUser = loggedInUser;
        next();

    } catch (exception) {
        if (exception instanceof TokenExpiredError) {
            next({
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Token expired. Please login again.", 
                statusCode: HttpResponse.unauthenticated
            });
        } else if (exception instanceof JsonWebTokenError) {
            next({
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Invalid token.", 
                statusCode: HttpResponse.unauthenticated
            });
        } else {
            next(exception);
        }
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.headers['refresh'] || null;
        
        if (!refreshToken) {
            throw {
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Refresh token not found.", 
                statusCode: HttpResponse.unauthenticated
            }
        }

        const data = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await authSvc.getUserByFilter({
            _id: data.sub
        });

        // 👇 BASE USER DATA (no status check for refresh)
        const loggedInUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            profileImage: user.profileImage,
            status: user.status
        };

        // 👇 ADD ROLE-SPECIFIC PROFILES
        if (user.role === 'student' && user.studentProfile) {
            loggedInUser.studentProfile = user.studentProfile;
        } else if (user.role === 'teacher' && user.teacherProfile) {
            loggedInUser.teacherProfile = user.teacherProfile;
        }

        req.loggedInUser = loggedInUser;
        next();

    } catch (exception) {
        if (exception instanceof TokenExpiredError) {
            next({
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Refresh token expired. Please login again.", 
                statusCode: HttpResponse.unauthenticated
            });
        } else if (exception instanceof JsonWebTokenError) {
            next({
                status: HttpResponseCode.UNAUTHENTICATED, 
                message: "Invalid refresh token.", 
                statusCode: HttpResponse.unauthenticated
            });
        } else {
            next(exception);
        }
    }
};

export { checkLogin, refreshToken };