import AccessRequestModel from "./access-request.model.js";
import StudyMaterialModel from "../material/material.model.js";
import UserModel from "../user/user.model.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";


class AccessRequestService {

    // STUDENT METHODS
    requestAccess = async (materialId, studentId, requestMessage = '') => {
        try {
            this.validateObjectId(materialId);

            // Check if material exists and is request-based
            const material = await StudyMaterialModel.findOne({
                _id: materialId,
                status: 'approved'
            });

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found or not approved",
                    statusCode: HttpResponse.notFound
                };
            }

            if (material.accessType !== 'request-based') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "This material does not require access requests",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Check if student already has a pending or approved request
            const existingRequest = await AccessRequestModel.findOne({
                student: studentId,
                material: materialId,
                status: { $in: ['pending', 'approved'] }
            });

            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    throw {
                        status: HttpResponseCode.CONFLICT,
                        message: "You already have a pending access request for this material",
                        statusCode: HttpResponse.validationFailed
                    };
                } else {
                    throw {
                        status: HttpResponseCode.CONFLICT,
                        message: "You already have access to this material",
                        statusCode: HttpResponse.validationFailed
                    };
                }
            }

            // Check if student is the uploader (auto-approve)
            if (material.uploadedBy.toString() === studentId) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "You are the uploader of this material and already have access",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Create access request
            const accessRequest = new AccessRequestModel({
                student: studentId,
                material: materialId,
                requestMessage: requestMessage
                // Teacher is auto-populated by model middleware
            });

            const savedRequest = await accessRequest.save();

            // Populate for response
            await savedRequest.populate([
                {
                    path: 'material', select: 'title materialType faculty course uploadedBy', populate: [
                        { path: 'faculty', select: 'name code' },
                        { path: 'course', select: 'name code' },
                        { path: 'uploadedBy', select: 'name email' }
                    ]
                },
                { path: 'teacher', select: 'name email' },
                { path: 'student', select: 'name email' }
            ]);

            return {
                request: this.formatAccessRequestResponse(savedRequest),
                message: "Access request submitted successfully. The teacher will review your request."
            };

        } catch (exception) {
            if (exception.code === 11000) {
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "You already have an active access request for this material",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    getStudentRequests = async (studentId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                status = 'all',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                materialType,
                faculty,
                ...queryFilters
            } = filters;

            let query = { student: studentId, ...queryFilters };

            if (status !== 'all') {
                query.status = status;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [requests, total] = await Promise.all([
                AccessRequestModel.find(query)
                    .populate([
                        {
                            path: 'material',
                            select: 'title description materialType thumbnail faculty course uploadedBy',
                            populate: [
                                { path: 'faculty', select: 'name code' },
                                { path: 'course', select: 'name code' },
                                { path: 'uploadedBy', select: 'name email' }
                            ]
                        },
                        { path: 'teacher', select: 'name email' }
                    ])
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                AccessRequestModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                requests: requests.map(request => this.formatAccessRequestResponse(request)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRequests: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    cancelRequest = async (requestId, studentId) => {
        try {
            this.validateObjectId(requestId);

            const request = await AccessRequestModel.findOne({
                _id: requestId,
                student: studentId
            });

            if (!request) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Access request not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (request.status !== 'pending') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: `Cannot cancel request with status: ${request.status}`,
                    statusCode: HttpResponse.validationFailed
                };
            }

            request.status = 'cancelled';
            request.respondedAt = new Date();
            await request.save();

            return {
                requestId: requestId,
                message: "Access request cancelled successfully"
            };

        } catch (exception) {
            throw exception;
        }
    };

    // TEACHER METHODS 
    getTeacherRequests = async (teacherId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                status = 'pending',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                materialType,
                period = 'all',
                ...queryFilters
            } = filters;

            let query = { teacher: teacherId, ...queryFilters };

            if (status !== 'all') {
                query.status = status;
            }

            // Apply time period filter
            if (period !== 'all') {
                const dateFilter = this.getDateFilter(period);
                query.createdAt = { $gte: dateFilter };
            }

            // Apply search filter for student name
            if (search) {
                const students = await UserModel.find({
                    name: { $regex: search, $options: 'i' },
                    role: 'student'
                }).select('_id');

                const studentIds = students.map(student => student._id);
                query.student = { $in: studentIds };
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [requests, total] = await Promise.all([
                AccessRequestModel.find(query)
                    .populate([
                        {
                            path: 'material',
                            select: 'title description materialType thumbnail faculty course',
                            populate: [
                                { path: 'faculty', select: 'name code' },
                                { path: 'course', select: 'name code' }
                            ]
                        },
                        { path: 'student', select: 'name email profileImage' },
                        { path: 'teacher', select: 'name email' }
                    ])
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                AccessRequestModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                requests: requests.map(request => this.formatAccessRequestResponse(request)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRequests: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    respondToRequest = async (requestId, teacherId, responseData) => {
        try {
            this.validateObjectId(requestId);

            const request = await AccessRequestModel.findOne({
                _id: requestId,
                teacher: teacherId,
                status: 'pending'
            });

            if (!request) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Pending access request not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Update request based on action
            if (responseData.action === 'approve') {
                request.approve(responseData.responseMessage, responseData.expiresInDays);
            } else {
                request.reject(responseData.responseMessage);
            }

            const savedRequest = await request.save();

            // Populate for response
            await savedRequest.populate([
                {
                    path: 'material',
                    select: 'title materialType faculty course',
                    populate: [
                        { path: 'faculty', select: 'name code' },
                        { path: 'course', select: 'name code' }
                    ]
                },
                { path: 'student', select: 'name email' },
                { path: 'teacher', select: 'name email' }
            ]);

            return {
                request: this.formatAccessRequestResponse(savedRequest),
                message: `Access request ${responseData.action}d successfully`
            };

        } catch (exception) {
            throw exception;
        }
    };

    //  COMMON METHODS
    getAccessStatus = async (materialId, userId, includeRequestDetails = false) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId)
                .select('accessType uploadedBy');

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Check access based on material type
            let hasAccess = false;
            let requestStatus = null;
            let requestDetails = null;

            switch (material.accessType) {
                case 'public':
                    hasAccess = true;
                    break;

                case 'private':
                    // Check if user has accessed via access code
                    const user = await UserModel.findById(userId).select('accessedMaterials');
                    hasAccess = user.accessedMaterials.some(access =>
                        access.materialId.toString() === materialId
                    );
                    break;

                case 'request-based':
                    // Check for approved access request
                    const accessRequest = await AccessRequestModel.hasAccess(userId, materialId);
                    if (accessRequest) {
                        hasAccess = true;
                        requestStatus = 'approved';
                        if (includeRequestDetails) {
                            requestDetails = this.formatAccessRequestResponse(accessRequest);
                        }
                    } else {
                        // Check if there's a pending request
                        const pendingRequest = await AccessRequestModel.findOne({
                            student: userId,
                            material: materialId,
                            status: 'pending'
                        });
                        if (pendingRequest) {
                            requestStatus = 'pending';
                            if (includeRequestDetails) {
                                requestDetails = this.formatAccessRequestResponse(pendingRequest);
                            }
                        } else {
                            // Check if request was rejected
                            const rejectedRequest = await AccessRequestModel.findOne({
                                student: userId,
                                material: materialId,
                                status: 'rejected'
                            });
                            if (rejectedRequest) {
                                requestStatus = 'rejected';
                                if (includeRequestDetails) {
                                    requestDetails = this.formatAccessRequestResponse(rejectedRequest);
                                }
                            }
                        }
                    }
                    break;
            }

            // Uploader always has access
            if (material.uploadedBy.toString() === userId) {
                hasAccess = true;
            }

            return {
                hasAccess,
                requestStatus,
                materialAccessType: material.accessType,
                requestDetails: includeRequestDetails ? requestDetails : undefined,
                isUploader: material.uploadedBy.toString() === userId
            };

        } catch (exception) {
            throw exception;
        }
    };

    getRequestById = async (requestId, userId, userRole) => {
        try {
            this.validateObjectId(requestId);

            let query = { _id: requestId };

            // Students can only see their own requests
            // Teachers can only see requests for their materials
            if (userRole === 'student') {
                query.student = userId;
            } else if (userRole === 'teacher') {
                query.teacher = userId;
            }
            // Admin can see all requests

            const request = await AccessRequestModel.findOne(query)
                .populate([
                    {
                        path: 'material',
                        select: 'title description materialType thumbnail faculty course uploadedBy',
                        populate: [
                            { path: 'faculty', select: 'name code' },
                            { path: 'course', select: 'name code' },
                            { path: 'uploadedBy', select: 'name email' }
                        ]
                    },
                    { path: 'student', select: 'name email profileImage' },
                    { path: 'teacher', select: 'name email profileImage' }
                ]);

            if (!request) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Access request not found",
                    statusCode: HttpResponse.notFound
                };
            }

            return this.formatAccessRequestResponse(request);

        } catch (exception) {
            throw exception;
        }
    };

    // HELPER METHODS
    getDateFilter = (period) => {
        const now = new Date();
        switch (period) {
            case 'today':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 1));
            default:
                return new Date(0); // Beginning of time
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

    formatAccessRequestResponse = (request) => {
        return {
            _id: request._id,
            student: request.student,
            material: request.material,
            teacher: request.teacher,
            status: request.status,
            requestMessage: request.requestMessage,
            responseMessage: request.responseMessage,
            accessExpiresAt: request.accessExpiresAt,
            autoCancelAt: request.autoCancelAt,
            respondedAt: request.respondedAt,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            // Virtual fields
            isExpired: request.isExpired,
            isAccessValid: request.isAccessValid
        };
    };
}

const accessRequestSvc = new AccessRequestService();
export default accessRequestSvc;