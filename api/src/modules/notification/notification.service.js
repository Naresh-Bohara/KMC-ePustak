import NotificationModel from "./notification.model.js";
import UserModel from "../user/user.model.js";
import HttpResponse from "../../constants/response-status.contants.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import mongoose from "mongoose";


class NotificationService {

    getUserNotifications = async (userId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 20,
                status = 'all',
                type = 'all',
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = filters;

            this.validateObjectId(userId);

            let query = { user: userId };

            // Status filter
            if (status !== 'all') {
                query.status = status;
            }

            // Type filter
            if (type !== 'all') {
                query.type = type;
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [notifications, total] = await Promise.all([
                NotificationModel.find(query)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                NotificationModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                notifications: notifications.map(notification => this.formatNotificationResponse(notification)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalNotifications: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    getUnreadCount = async (userId) => {
        try {
            this.validateObjectId(userId);

            const count = await NotificationModel.countDocuments({
                user: userId,
                status: 'unread'
            });

            return count;

        } catch (exception) {
            throw exception;
        }
    };

    markAsRead = async (notificationId, userId) => {
        try {
            this.validateObjectId(notificationId);
            this.validateObjectId(userId);

            const notification = await NotificationModel.findOne({
                _id: notificationId,
                user: userId
            });

            if (!notification) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Notification not found",
                    statusCode: HttpResponse.notFound
                };
            }

            notification.status = 'read';
            await notification.save();

            return this.formatNotificationResponse(notification);

        } catch (exception) {
            throw exception;
        }
    };

    markAllAsRead = async (userId, readAll = false) => {
        try {
            this.validateObjectId(userId);

            const result = await NotificationModel.updateMany(
                { 
                    user: userId, 
                    status: 'unread'
                },
                { 
                    status: 'read' 
                }
            );

            return {
                modifiedCount: result.modifiedCount
            };

        } catch (exception) {
            throw exception;
        }
    };

    deleteNotification = async (notificationId, userId) => {
        try {
            this.validateObjectId(notificationId);
            this.validateObjectId(userId);

            const notification = await NotificationModel.findOneAndDelete({
                _id: notificationId,
                user: userId
            });

            if (!notification) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Notification not found",
                    statusCode: HttpResponse.notFound
                };
            }

            return {
                message: "Notification deleted successfully",
                notificationId: notificationId
            };

        } catch (exception) {
            throw exception;
        }
    };

    broadcastNotification = async (data) => {
        try {
            const { title, message, type, actionUrl, createdBy } = data;

            // Get all active users
            const users = await UserModel.find({ status: 'active' }).select('_id');
            const userIds = users.map(user => user._id);

            if (userIds.length === 0) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "No active users found",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Create notifications for all users
            const notifications = userIds.map(userId => ({
                user: userId,
                title,
                message,
                type,
                actionUrl,
                status: 'unread'
            }));

            await NotificationModel.insertMany(notifications);

            return {
                sentCount: userIds.length
            };

        } catch (exception) {
            throw exception;
        }
    };

    sendToRole = async (data) => {
        try {
            const { title, message, type, role, actionUrl, createdBy } = data;

            // Get users by role and status
            const users = await UserModel.find({ 
                role: role,
                status: 'active' 
            }).select('_id');

            const userIds = users.map(user => user._id);

            if (userIds.length === 0) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: `No active users found with role: ${role}`,
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Create notifications for users with specific role
            const notifications = userIds.map(userId => ({
                user: userId,
                title,
                message,
                type,
                actionUrl,
                status: 'unread'
            }));

            await NotificationModel.insertMany(notifications);

            return {
                sentCount: userIds.length
            };

        } catch (exception) {
            throw exception;
        }
    };

    // ==================== INTERNAL SERVICE METHODS ====================

    createNotification = async (notificationData) => {
        try {
            const notification = new NotificationModel(notificationData);
            const savedNotification = await notification.save();

            return this.formatNotificationResponse(savedNotification);

        } catch (exception) {
            throw exception;
        }
    };

    createMaterialNotification = async (materialData, actionType, userId) => {
        try {
            let title, message;

            switch (actionType) {
                case 'material_approved':
                    title = "Material Approved";
                    message = `Your material "${materialData.title}" has been approved and is now live.`;
                    break;
                case 'material_rejected':
                    title = "Material Rejected";
                    message = `Your material "${materialData.title}" was rejected. Reason: ${materialData.rejectionReason}`;
                    break;
                case 'new_material':
                    title = "New Material Available";
                    message = `New material "${materialData.title}" has been uploaded.`;
                    break;
                default:
                    throw {
                        status: HttpResponseCode.BAD_REQUEST,
                        message: "Invalid material action type",
                        statusCode: HttpResponse.validationFailed
                    };
            }

            const notificationData = {
                user: userId,
                type: actionType,
                title,
                message,
                relatedTo: {
                    entity: 'material',
                    id: materialData._id
                },
                actionUrl: `/materials/${materialData._id}`,
                status: 'unread'
            };

            return await this.createNotification(notificationData);

        } catch (exception) {
            throw exception;
        }
    };

    createAccessNotification = async (accessData, actionType, userId) => {
        try {
            let title, message;

            switch (actionType) {
                case 'access_request':
                    title = "Access Request Received";
                    message = `New access request for material "${accessData.materialTitle}".`;
                    break;
                case 'access_approved':
                    title = "Access Approved";
                    message = `Your access request for "${accessData.materialTitle}" has been approved.`;
                    break;
                case 'access_rejected':
                    title = "Access Rejected";
                    message = `Your access request for "${accessData.materialTitle}" was rejected.`;
                    break;
                default:
                    throw {
                        status: HttpResponseCode.BAD_REQUEST,
                        message: "Invalid access action type",
                        statusCode: HttpResponse.validationFailed
                    };
            }

            const notificationData = {
                user: userId,
                type: actionType,
                title,
                message,
                relatedTo: {
                    entity: 'access_request',
                    id: accessData._id
                },
                actionUrl: `/materials/${accessData.materialId}`,
                status: 'unread'
            };

            return await this.createNotification(notificationData);

        } catch (exception) {
            throw exception;
        }
    };

    validateObjectId = (id) => {
        if (id instanceof mongoose.Types.ObjectId) {
            return true;
        }
        
        if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
            return true;
        }
        
        throw {
            status: HttpResponseCode.BAD_REQUEST,
            message: "Invalid ID format",
            statusCode: HttpResponse.validationFailed
        };
    };

    formatNotificationResponse = (notification) => {
        return {
            _id: notification._id,
            user: notification.user,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            relatedTo: notification.relatedTo,
            status: notification.status,
            actionUrl: notification.actionUrl,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt
        };
    };
}

const notificationSvc = new NotificationService();
export default notificationSvc;