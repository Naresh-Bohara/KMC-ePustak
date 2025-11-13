import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";
import authSvc from "./auth.service.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

class AuthController {
  register = async (req, res, next) => {
    try {
      // Transform and prepare user data
      const formattedData = await authSvc.transformCreateUser(req);
      const user = await authSvc.registerUser(formattedData);

      // Send activation email for students/teachers
      await authSvc.sendActivationEmail(user);

      res.json({
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        },
        message: "Registration successful. Please check your email for activation code.",
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      console.log(exception);
      next(exception);
    }
  };

  activateUser = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      
      // Verify user and OTP
      const user = await authSvc.getUserByFilter({
        email: email,
      });

      if (user.status !== "pending") {
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: "User already activated or not pending.", 
          statusCode: HttpResponse.validationFailed
        }
      }

      if (user.activationToken !== otp) {
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: "Incorrect OTP code", 
          statusCode: HttpResponse.validationFailed
        }
      }

      // Check OTP expiry
      let today = new Date();
      today = today.getTime();
      let otpExpiryTime = user.expiryTime.getTime();

      if ((today - otpExpiryTime) > 0) {
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: "OTP code expired", 
          statusCode: HttpResponse.validationFailed
        }
      }

      // Activate user based on role
      let status = "active";
      let message = "Account activated successfully. Please login to continue.";
      
      // Teachers need admin verification after OTP activation
      if (user.role === 'teacher') {
        status = "pending";
        message = "Account activated. Waiting for admin verification to upload materials.";
      }

      const update = await authSvc.activateUser(user._id, user.role);

      res.json({
        data: null,
        message: message,
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      console.log(exception);
      next(exception);
    }
  };

  resendOtp = async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await authSvc.getUserByFilter({
        email: email
      });

      if (user.status !== "pending") {
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: "User already activated.", 
          statusCode: HttpResponse.validationFailed
        }
      }

      const newOtpCode = authSvc.generateActivationOtp();
      await authSvc.updateUserById(newOtpCode, user._id);

      await authSvc.reSendActivationEmail({
        email: user.email, 
        activationToken: newOtpCode.activationToken, 
        name: user.name,
        role: user.role
      });

      res.json({
        data: null,
        message: "A new OTP code has been sent to your email.",
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      console.log(exception);
      next(exception);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await authSvc.getUserByFilter({
        email: email
      });

      // Check user status
      if (user.status !== "active") {
        let message = "Account not active.";
        if (user.status === "pending") {
          if (user.role === 'teacher') {
            message = "Account pending admin verification.";
          } else {
            message = "Account pending activation. Please check your email.";
          }
        }
        
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: message, 
          statusCode: HttpResponse.user.notActivate
        }
      }

      // Verify password
      if (bcrypt.compareSync(password, user.password)) {
        // Login success - generate tokens
        const payload = {
          sub: user._id,
          role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: '10h', 
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "15d"
        });

        // Prepare user details based on role
        let userDetail = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profileImage: user.profileImage,
          lastLogin: user.lastLogin
        };

        // Add role-specific details
        if (user.role === 'student') {
          userDetail.studentProfile = user.studentProfile;
        } else if (user.role === 'teacher') {
          userDetail.teacherProfile = user.teacherProfile;
        }

        // Update last login
        await authSvc.updateUserById({ lastLogin: new Date() }, user._id);

        res.json({
          data: {
            token: token,
            refreshToken: refreshToken,
            detail: userDetail
          },
          message: "Login successful.",
          status: HttpResponse.success,
          options: null
        });

      } else {
        throw {
          status: HttpResponseCode.BAD_REQUEST, 
          message: "Invalid credentials.", 
          statusCode: HttpResponse.user.credentialNotMatch
        }
      }

    } catch (exception) {
      console.log(exception);
      next(exception);
    }
  };

  getLoggedInUser = async (req, res, next) => {
    try {
      // Populate user data with references
      const user = await authSvc.getUserByFilter({ _id: req.loggedInUser._id });
      
      let userDetail = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profileImage: user.profileImage,
        status: user.status,
        lastLogin: user.lastLogin
      };

      // Add role-specific populated data
      if (user.role === 'student' && user.studentProfile) {
        userDetail.studentProfile = user.studentProfile;
      } else if (user.role === 'teacher' && user.teacherProfile) {
        userDetail.teacherProfile = user.teacherProfile;
      }

      res.json({
        data: userDetail,
        message: "User profile fetched successfully.",
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      next(exception);
    }
  };

  refreshToken = (req, res, next) => {
    try {
      const loggedInUser = req.loggedInUser;

      const payload = {
        sub: loggedInUser._id,
        role: loggedInUser.role
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "10h" 
      }); 

      const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15d"
      });

      res.json({
        data: {
          token: token,
          refreshToken: refreshToken
        },
        message: "Token refreshed successfully.",
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      next(exception);
    }
  };

  getUserList = async (req, res, next) => {
    try {
      const role = req?.query?.role || null;
      let filter = {
        _id: { $ne: req.loggedInUser._id }
      };
      
      if (role) {
        filter = { ...filter, role: role };
      }

      const userList = await authSvc.getListOfUsers(filter, role);
      
      res.json({
        data: userList,
        message: "Users retrieved successfully.",
        status: HttpResponse.success,
        options: null
      });
      
    } catch (exception) {
      next(exception);
    }
  };

  // Additional method for admin to verify teachers
verifyTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.body;
    
    // Check if user is admin
    if (req.loggedInUser.role !== 'admin') {
      throw {
        status: HttpResponseCode.FORBIDDEN,
        message: "Only admin can verify teachers.",
        statusCode: HttpResponse.accessDenied
      }
    }

    // Validate teacherId format
    if (!teacherId || !teacherId.match(/^[0-9a-fA-F]{24}$/)) {
      throw {
        status: HttpResponseCode.BAD_REQUEST,
        message: "Invalid teacher ID format",
        statusCode: HttpResponse.validationFailed,
        details: "Teacher ID must be a valid 24-character ID"
      }
    }

    // Get teacher and validate
    const teacher = await authSvc.getUserByFilter({ _id: teacherId });
    
    // Check if user is actually a teacher
    if (teacher.role !== 'teacher') {
      throw {
        status: HttpResponseCode.BAD_REQUEST,
        message: "User is not a teacher",
        statusCode: HttpResponse.validationFailed,
        details: `User role is ${teacher.role}, expected teacher`
      }
    }

    // Check if teacher is already verified
    if (teacher.status === 'active' && teacher.teacherProfile?.isVerified) {
      throw {
        status: HttpResponseCode.BAD_REQUEST,
        message: "Teacher is already verified",
        statusCode: HttpResponse.validationFailed
      }
    }

    // Check if teacher is in pending status
    if (teacher.status !== 'pending') {
      throw {
        status: HttpResponseCode.BAD_REQUEST,
        message: "Teacher account is not in pending status",
        statusCode: HttpResponse.validationFailed,
        details: `Current status: ${teacher.status}`
      }
    }

    // Verify the teacher
    const verifiedTeacher = await authSvc.verifyTeacher(teacherId, req.loggedInUser._id);
    
    res.json({
      data: {
        _id: verifiedTeacher._id,
        name: verifiedTeacher.name,
        email: verifiedTeacher.email,
        status: verifiedTeacher.status,
        isVerified: verifiedTeacher.teacherProfile?.isVerified
      },
      message: "Teacher verified successfully. They can now upload materials.",
      status: HttpResponse.success,
      options: null
    });
    
  } catch (exception) {
    next(exception);
  }
};

  // Update user profile
  updateUserById = async (req, res, next) => {
    try {
      const userId = req.params.id;
      const data = req.body;

      // Ensure users can only update their own profile (unless admin)
      if (req.loggedInUser.role !== 'admin' && userId !== req.loggedInUser._id.toString()) {
        throw {
          status: HttpResponseCode.FORBIDDEN,
          message: "You can only update your own profile.",
          statusCode: HttpResponse.validationFailed
        }
      }

      const updatedUser = await authSvc.updateUserById(data, userId);
      
      res.json({
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone
        },
        message: "Profile updated successfully.",
        status: HttpResponse.success,
        options: null
      });

    } catch (exception) {
      next(exception);
    }
  };

  // Get pending teachers for admin verification
  getPendingTeachers = async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.loggedInUser.role !== 'admin') {
        throw {
          status: HttpResponseCode.FORBIDDEN,
          message: "Only admin can view pending teachers.",
          statusCode: HttpResponse.validationFailed
        }
      }

      const pendingTeachers = await authSvc.getListOfUsers(
        { 
          role: 'teacher',
          status: 'pending'
        }, 
        'teacher'
      );
      
      res.json({
        data: pendingTeachers,
        message: "Pending teachers retrieved successfully.",
        status: HttpResponse.success,
        options: null
      });
      
    } catch (exception) {
      next(exception);
    }
  };
}

const authCtrl = new AuthController();
export default authCtrl;