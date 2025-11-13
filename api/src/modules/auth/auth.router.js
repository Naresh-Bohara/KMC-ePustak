import { Router } from "express";

import { activationDTO, loginDTO, resendOtpDTO, userRegistrationDTO  } from "./auth.request.js";
import { uploadFile } from "../../middlewares/multipart-parser.middleware.js";
import { bodyValidator } from "../../middlewares/request-validator.middleware.js";
import { checkLogin, refreshToken } from "../../middlewares/auth.middleware.js";
import authCtrl from "./auth.controller.js";
import { checkPermission, Require } from "../../middlewares/rbac.middleware.js";

const authRouter = Router();

authRouter.post("/register", uploadFile("image").single('image'), bodyValidator(userRegistrationDTO), authCtrl.register);
authRouter.post("/activate", bodyValidator(activationDTO), authCtrl.activateUser);
authRouter.post("/resend-otp", bodyValidator(resendOtpDTO), authCtrl.resendOtp);

authRouter.post("/login", bodyValidator(loginDTO), authCtrl.login);
authRouter.get("/refresh", refreshToken, authCtrl.refreshToken);

authRouter.get("/me", checkLogin, authCtrl.getLoggedInUser);
authRouter.put("/profile/:id", checkLogin, authCtrl.updateUserById);

authRouter.get("/users", checkLogin, checkPermission(['admin']), authCtrl.getUserList);
authRouter.get("/pending-teachers", checkLogin, Require.Admin, authCtrl.getPendingTeachers);
authRouter.post("/verify-teacher", checkLogin, Require.Admin, authCtrl.verifyTeacher);

export default authRouter;