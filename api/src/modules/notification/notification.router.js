import { Router } from "express";
import { queryValidator, bodyValidator } from "../../middlewares/request-validator.middleware.js";
import { 
  getNotificationsDTO, 
  markAsReadDTO 
} from "./notification.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import notificationCtrl from "./notification.controller.js";

const notificationRouter = Router();

// USER ROUTE
// Get user's notifications with filters and pagination
notificationRouter.get("/", checkLogin, queryValidator(getNotificationsDTO), notificationCtrl.getUserNotifications);

// Get unread notifications count
notificationRouter.get("/unread-count", checkLogin, notificationCtrl.getUnreadCount);

// Mark specific notification as read
notificationRouter.post("/:notificationId/read", checkLogin, notificationCtrl.markAsRead);

// Mark all notifications as read
notificationRouter.post("/read-all", checkLogin, bodyValidator(markAsReadDTO), notificationCtrl.markAllAsRead);

// Delete specific notification
notificationRouter.delete("/:notificationId", checkLogin, notificationCtrl.deleteNotification);

// ==================== ADMIN ROUTES ====================

// Send notification to all users (broadcast)
notificationRouter.post("/admin/broadcast", checkLogin, Require.Admin, notificationCtrl.broadcastNotification);

// Send notification to specific role
notificationRouter.post("/admin/send-to-role", checkLogin, Require.Admin, notificationCtrl.sendToRole);

export default notificationRouter;