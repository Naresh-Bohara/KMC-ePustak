import bcrypt from "bcryptjs"
import { generateDateTime, generateRandomString } from "../../utilities/helpers.js";
import UserModel from "../user/user.model.js"
import mailSvc from "../../services/mail.service.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";

class AuthService {
    
    // Generate activation OTP
    generateActivationOtp = () => {
        return {
            activationToken: generateRandomString(6).toUpperCase(),
            expiryTime: generateDateTime(5),
        }
    }

    // Transform and prepare user data for registration
    transformCreateUser = async (req) => {
        try {
            const data = req.body;
            
            // Hash password
            data.password = bcrypt.hashSync(data.password, 12);

            // Base user data - ONLY FOR STUDENT/TEACHER
            const formattedData = {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role, // Will be either 'student' or 'teacher'
                phone: data.phone,
                status: "pending", 
                ...this.generateActivationOtp()
            };

            // 👇 Add role-specific profiles (NO ADMIN)
            if (data.role === 'student') {
                formattedData.studentProfile = {
                    faculty: data.studentProfile.faculty,
                    academicSystem: data.studentProfile.academicSystem,
                    semester: data.studentProfile.semester,
                    academicYear: data.studentProfile.academicYear,
                    enrollmentYear: data.studentProfile.enrollmentYear,
                    rollNumber: data.studentProfile.rollNumber
                };
            }

            if (data.role === 'teacher') {
                formattedData.teacherProfile = {
                    faculties: data.teacherProfile.faculties,
                    courses: data.teacherProfile.courses || [],
                    employeeId: data.teacherProfile.employeeId,
                    designation: data.teacherProfile.designation || 'Lecturer',
                    specialization: data.teacherProfile.specialization,
                    isVerified: false 
                };
            }

            return formattedData;

        } catch (exception) {
            throw exception;
        }
    }

    // Register new user (ONLY STUDENT/TEACHER)
    registerUser = async (data) => {
        try {
            // Check if user with this email already exists
            const existingUser = await UserModel.findOne({ email: data.email });
            if (existingUser) {
                throw new Error("Email is already registered.");
            }

            // If no user exists, proceed to save the new user
            const userObj = new UserModel(data);
            return await userObj.save();
        } catch (exception) {
            throw exception;
        }
    }

    // Send activation email for students/teachers
    sendActivationEmail = async (user) => {
        try {
            let msg = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <header style="text-align: center; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; margin-bottom: 20px;">
                    <h2 style="color: #333;">Welcome to College Resource Portal!</h2>
                    <p style="font-size: 14px; color: #777;">Your academic resource hub</p>
                </header>
                
                <p style="font-size: 16px; color: #333;">Dear ${user.name},</p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Your account has been successfully created as a <strong>${user.role}</strong>. 
                    To start using your account, please activate it using the OTP code provided below.
                </p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span style="display: inline-block; padding: 15px 30px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #2563eb; border-radius: 8px;">
                        ${user.activationToken}
                    </span>
                </div>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    <strong>Note:</strong> This code is valid for only 5 minutes. 
                    ${user.role === 'teacher' ? 'After activation, your account will be reviewed by admin before you can upload materials.' : ''}
                </p>
                
                <footer style="margin-top: 20px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px; color: #777;">
                    <p style="font-size: 14px;">Regards,</p>
                    <p style="font-size: 14px; font-weight: bold; color: #333;">College Resource Portal Team</p>
                    <p style="font-size: 12px; color: #999;">Please do not reply to this email.</p>
                </footer>
            </div>
        `;
        
            await mailSvc.sendEmail(user.email, "Activate your College Portal Account", msg);
            return true;
        } catch (exception) {
            throw exception;
        }
    }

    // Resend activation email
    reSendActivationEmail = async (user) => {
        try {
            let msg = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <header style="text-align: center; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; margin-bottom: 20px;">
                    <h2 style="color: #333;">Your New OTP Code</h2>
                    <p style="font-size: 14px; color: #777;">College Resource Portal</p>
                </header>
                
                <p style="font-size: 16px; color: #333;">Dear ${user.name},</p>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    Here is your new activation code. Please use this OTP within 5 minutes to activate your account.
                </p>
        
                <div style="text-align: center; margin: 20px 0;">
                    <span style="display: inline-block; padding: 15px 30px; font-size: 18px; font-weight: bold; color: #ffffff; background-color: #2563eb; border-radius: 8px;">
                        ${user.activationToken}
                    </span>
                </div>
        
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                    <strong>Note:</strong> This code is valid for only 5 minutes.
                </p>
        
                <footer style="margin-top: 20px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 10px; color: #777;">
                    <p style="font-size: 14px;">Regards,</p>
                    <p style="font-size: 14px; font-weight: bold; color: #333;">College Resource Portal Team</p>
                    <p style="font-size: 12px; color: #999;">Please do not reply to this email.</p>
                </footer>
            </div>
            `;
            
            await mailSvc.sendEmail(user.email, "New Activation Code - College Portal", msg);
            return true;
        } catch (exception) {
            throw exception;
        }
    }

    // Get user by filter
    getUserByFilter = async (filter) => {
        try {
            const user = await UserModel.findOne(filter);
            if (!user) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST, 
                    message: "User Not Found", 
                    statusCode: HttpResponse.validationFailed
                }
            }
            return user;
        } catch (exception) {
            throw exception;
        }
    }

    // Update user by ID
    updateUserById = async (data, userId) => {
        try {
            const user = await UserModel.findByIdAndUpdate(
                userId, 
                { $set: data },
                { new: true } 
            );
            return user;
        } catch (exception) {
            throw exception;
        }
    }

    // Get list of users with filtering
    getListOfUsers = async (filter = {}, role = null) => {
        try {
            let query = { ...filter };
            
            // Filter by role if specified
            if (role) {
                query.role = role;
            }
            
            const users = await UserModel.find(query)
                .select("-password -activationToken -expiryTime -forgetToken")
                .populate('studentProfile.faculty', 'name code')
                .populate('teacherProfile.faculties', 'name code')
                .populate('teacherProfile.courses', 'name code')
                .sort({ name: 1 });

            return users;
        } catch (exception) {
            throw exception;
        }
    }

    // Additional method for teacher verification
    verifyTeacher = async (teacherId, verifiedBy) => {
        try {
            const teacher = await UserModel.findByIdAndUpdate(
                teacherId,
                { 
                    $set: { 
                        'teacherProfile.isVerified': true,
                        status: 'active'
                    } 
                },
                { new: true }
            );
            return teacher;
        } catch (exception) {
            throw exception;
        }
    }

    // Activate user account (for students/teachers after OTP verification)
    activateUser = async (userId, userRole) => {
        try {
            let status = "active";
            
            // Teachers need admin verification after OTP activation
            if (userRole === 'teacher') {
                status = "pending"; // Waiting for admin verification
            }

            const user = await UserModel.findByIdAndUpdate(
                userId,
                { 
                    $set: { 
                        status: status,
                        activationToken: null,
                        expiryTime: null
                    } 
                },
                { new: true }
            );
            return user;
        } catch (exception) {
            throw exception;
        }
    }

    // Create admin manually (for database seeding)
    createAdminUser = async (adminData) => {
        try {
            // Check if admin already exists
            const existingAdmin = await UserModel.findOne({ 
                email: adminData.email,
                role: 'admin' 
            });
            
            if (existingAdmin) {
                throw new Error("Admin user already exists.");
            }

            // Hash password
            adminData.password = bcrypt.hashSync(adminData.password, 12);
            
            const adminUser = new UserModel({
                name: adminData.name,
                email: adminData.email,
                password: adminData.password,
                role: 'admin',
                phone: adminData.phone,
                status: 'active'
            });

            return await adminUser.save();
        } catch (exception) {
            throw exception;
        }
    }
}

const authSvc = new AuthService();
export default authSvc;