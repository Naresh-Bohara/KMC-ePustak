import HttpResponse from "../../constants/response-status.contants.js";
import notificationSvc from "./notification.service.js";


class NotificationController {
    
    getUserNotifications = async (req, res, next) => {
        try {
            const result = await notificationSvc.getUserNotifications(
                req.loggedInUser._id, 
                req.query
            );
            
            res.json({
                data: result.notifications,
                pagination: result.pagination,
                message: result.notifications.length > 0 
                    ? "Notifications retrieved successfully" 
                    : "No notifications found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getUnreadCount = async (req, res, next) => {
        try {
            const count = await notificationSvc.getUnreadCount(req.loggedInUser._id);
            
            res.json({
                data: { unreadCount: count },
                message: "Unread count fetched successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    markAsRead = async (req, res, next) => {
        try {
            const notification = await notificationSvc.markAsRead(
                req.params.notificationId, 
                req.loggedInUser._id
            );
            
            res.json({
                data: notification,
                message: "Notification marked as read",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    markAllAsRead = async (req, res, next) => {
        try {
            const result = await notificationSvc.markAllAsRead(
                req.loggedInUser._id, 
                req.body.readAll || false
            );
            
            res.json({
                data: { modifiedCount: result.modifiedCount },
                message: "All notifications marked as read",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    deleteNotification = async (req, res, next) => {
        try {
            const result = await notificationSvc.deleteNotification(
                req.params.notificationId, 
                req.loggedInUser._id
            );
            
            res.json({
                data: result,
                message: "Notification deleted successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    broadcastNotification = async (req, res, next) => {
        try {
            const result = await notificationSvc.broadcastNotification({
                ...req.body,
                createdBy: req.loggedInUser._id
            });
            
            res.json({
                data: { sentCount: result.sentCount },
                message: "Notification broadcasted to all users",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    sendToRole = async (req, res, next) => {
        try {
            const result = await notificationSvc.sendToRole({
                ...req.body,
                createdBy: req.loggedInUser._id
            });
            
            res.json({
                data: { sentCount: result.sentCount },
                message: `Notification sent to all ${req.body.role}s`,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // ==================== INTERNAL SERVICE METHODS ====================

    createNotification = async (notificationData) => {
        return await notificationSvc.createNotification(notificationData);
    };

    createMaterialNotification = async (materialData, actionType, userId) => {
        return await notificationSvc.createMaterialNotification(materialData, actionType, userId);
    };

    createAccessNotification = async (accessData, actionType, userId) => {
        return await notificationSvc.createAccessNotification(accessData, actionType, userId);
    };
}

const notificationCtrl = new NotificationController();
export default notificationCtrl;