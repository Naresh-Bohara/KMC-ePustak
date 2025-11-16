import UserModel from "../user/user.model.js";
import StudyMaterialModel from "../material/material.model.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";


class AdminService {

    deleteUser = async (userId, adminId, reason = "") => {
        try {
            this.validateObjectId(userId);

            const user = await UserModel.findById(userId);
            
            if (!user) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "User not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Prevent admin from deleting themselves
            if (user._id.toString() === adminId.toString()) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Cannot delete your own account",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Prevent deleting other admins
            if (user.role === 'admin') {
                throw {
                    status: HttpResponseCode.FORBIDDEN,
                    message: "Cannot delete admin accounts",
                    statusCode: HttpResponse.forbidden
                };
            }

            // Delete user's materials if they are a teacher
            if (user.role === 'teacher') {
                await StudyMaterialModel.deleteMany({ uploadedBy: userId });
            }

            // Remove user's bookmarks from all materials
            await StudyMaterialModel.updateMany(
                { bookmarks: userId },
                { $pull: { bookmarks: userId } }
            );

            // Delete the user
            await UserModel.findByIdAndDelete(userId);

            return {
                message: `User ${user.name} (${user.role}) deleted successfully`,
                deletedUser: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                reason: reason || "No reason provided"
            };

        } catch (exception) {
            throw exception;
        }
    };

    changeUserStatus = async (userId, status, adminId, reason = "") => {
        try {
            this.validateObjectId(userId);

            const user = await UserModel.findById(userId);
            
            if (!user) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "User not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Prevent admin from changing their own status
            if (user._id.toString() === adminId.toString()) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Cannot change your own account status",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Update user status
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { 
                    status: status,
                    $set: {
                        statusUpdatedBy: adminId,
                        statusUpdatedAt: new Date(),
                        statusReason: reason
                    }
                },
                { new: true }
            ).select('_id name email role status');

            return {
                message: `User status changed to ${status} successfully`,
                user: updatedUser,
                reason: reason || "No reason provided"
            };

        } catch (exception) {
            throw exception;
        }
    };

    getUsersByRole = async (role, filters = {}) => {
        try {
            const { page = 1, limit = 20, status } = filters;

            let query = { role: role };
            if (status) query.status = status;

            const [users, total] = await Promise.all([
                UserModel.find(query)
                    .select('_id name email role status profileImage createdAt lastLogin')
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                UserModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                users: users.map(user => this.formatUserResponse(user)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalUsers: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    validateObjectId = (id) => {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Invalid ID format",
                statusCode: HttpResponse.validationFailed
            };
        }
    };

    formatUserResponse = (user) => {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            profileImage: user.profileImage,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt
        };
    };
}

const adminSvc = new AdminService();
export default adminSvc;