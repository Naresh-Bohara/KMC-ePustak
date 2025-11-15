import StudyMaterialModel from "./material.model.js";
import FacultyModel from "../faculty/faculty.model.js";
import CourseModel from "../course/course.model.js";

import FileUploadService from "../../services/cloudinary.service.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";
import UserModel from "../user/user.model.js";


class MaterialService {

    uploadFile = async (file, userId) => {
        try {
            if (!file) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "No file uploaded",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const uploadResult = await FileUploadService.uploadFile(
                file.path,
                'kmc-epustak/materials'
            );

            return {
                fileUrl: uploadResult.secure_url,
                fileName: file.originalname,
                fileSize: uploadResult.bytes,
                fileType: file.originalname.split('.').pop().toLowerCase(),
                publicId: uploadResult.public_id
            };

        } catch (exception) {
            throw exception;
        }
    };

    createMaterial = async (data, userId) => {
        try {
            if (!data.fileUrl && !data.youtubeUrl) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Either file URL or YouTube URL is required",
                    statusCode: HttpResponse.validationFailed
                };
            }

            if (data.youtubeUrl) {
                data.youtubeVideoId = this.extractYouTubeId(data.youtubeUrl);
                data.fileType = 'video';
                data.fileSize = data.fileSize || 0;
                data.thumbnail = this.getYouTubeThumbnail(data.youtubeVideoId);
            }

            const faculty = await FacultyModel.findOne({
                _id: data.faculty,
                status: 'active'
            });

            if (!faculty) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Faculty not found or inactive",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const course = await CourseModel.findOne({
                _id: data.course,
                status: 'active'
            });

            if (!course) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Course not found or inactive",
                    statusCode: HttpResponse.validationFailed
                };
            }

            if (course.faculty.toString() !== data.faculty) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Course does not belong to the selected faculty",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const materialData = {
                ...data,
                uploadedBy: userId
            };

            const material = new StudyMaterialModel(materialData);
            const savedMaterial = await material.save();

            await savedMaterial.populate('faculty', 'name code');
            await savedMaterial.populate('course', 'name code');
            await savedMaterial.populate('uploadedBy', 'name email');

            return this.formatMaterialResponse(savedMaterial);

        } catch (exception) {
            if (exception.code === 11000) {
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "Material with similar details already exists",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    getMaterials = async (filters = {}, userId, userRole) => {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                search,
                materialType,
                faculty,
                course,
                academicSystem,
                semester,
                academicYear,
                accessType,
                ...queryFilters
            } = filters;

            let query = { ...queryFilters };

            // Admin sees all materials regardless of status
            if (userRole !== 'admin') {
                query.status = 'approved';

                // For non-admin users, handle private material access
                const user = await UserModel.findById(userId).select('accessedMaterials');
                const accessedMaterialIds = user.accessedMaterials.map(access => access.materialId);

                // Show public materials OR private materials that user has accessed
                query.$and = [
                    {
                        $or: [
                            { accessType: 'public' },
                            {
                                accessType: 'private',
                                _id: { $in: accessedMaterialIds }
                            },
                            { accessType: 'request-based' } // request-based materials are visible but need approval
                        ]
                    }
                ];
            }

            if (materialType) query.materialType = materialType;
            if (faculty) query.faculty = faculty;
            if (course) query.course = course;
            if (academicSystem) query.academicSystem = academicSystem;
            if (semester) query.semester = semester;
            if (academicYear) query.academicYear = academicYear;
            if (accessType) query.accessType = accessType;

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find(query)
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .populate('uploadedBy', 'name email')
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                StudyMaterialModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                materials: materials.map(material => this.formatMaterialResponse(material)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMaterials: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    getMaterialById = async (materialId, userId) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId)
                .populate('faculty', 'name code')
                .populate('course', 'name code')
                .populate('uploadedBy', 'name email')
                .populate('verifiedBy', 'name email');

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Check access for private materials
            if (material.accessType === 'private' && material.status === 'approved') {
                const user = await UserModel.findById(userId).select('accessedMaterials role');
                const hasAccess = user.accessedMaterials.some(access =>
                    access.materialId.toString() === materialId
                );

                if (!hasAccess) {
                    throw {
                        status: HttpResponseCode.FORBIDDEN,
                        message: "Access denied. You need the access code to view this material",
                        statusCode: HttpResponse.forbidden
                    };
                }
            }

            // Check access for request-based materials
            if (material.accessType === 'request-based' && material.status === 'approved') {
                const isOwner = material.uploadedBy._id.toString() === userId;
                if (!isOwner) {
                    throw {
                        status: HttpResponseCode.FORBIDDEN,
                        message: "Access denied. Please request access from the uploader",
                        statusCode: HttpResponse.forbidden
                    };
                }
            }

            material.viewCount += 1;
            await material.save();

            return this.formatMaterialResponse(material, true);

        } catch (exception) {
            if (exception.name === 'CastError') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Invalid material ID",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    validateAccess = async (materialId, accessCode, userId) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId);

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (material.status !== 'approved') {
                throw {
                    status: HttpResponseCode.FORBIDDEN,
                    message: "Material not available",
                    statusCode: HttpResponse.forbidden
                };
            }

            let hasAccess = false;
            let message = "Access denied";

            switch (material.accessType) {
                case 'public':
                    hasAccess = true;
                    message = "Access granted";
                    break;

                case 'private':
                    if (material.accessCode === accessCode) {
                        hasAccess = true;
                        message = "Access granted";

                        // Add material to user's accessed materials
                        await UserModel.findByIdAndUpdate(
                            userId,
                            {
                                $addToSet: {
                                    accessedMaterials: {
                                        materialId: materialId,
                                        accessCode: accessCode,
                                        accessedAt: new Date()
                                    }
                                }
                            }
                        );
                    } else {
                        message = "Invalid access code";
                    }
                    break;

                case 'request-based':
                    if (material.uploadedBy.toString() === userId) {
                        hasAccess = true;
                        message = "Access granted (Owner)";
                    } else {
                        message = "Please request access from the uploader";
                    }
                    break;
            }

            return {
                hasAccess,
                material: hasAccess ? this.formatMaterialResponse(material, true) : null,
                message
            };

        } catch (exception) {
            throw exception;
        }
    };

    downloadMaterial = async (materialId, userId) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId);

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (material.status !== 'approved') {
                throw {
                    status: HttpResponseCode.FORBIDDEN,
                    message: "Material not available for download",
                    statusCode: HttpResponse.forbidden
                };
            }

            // Check access for private materials before download
            if (material.accessType === 'private') {
                const user = await UserModel.findById(userId).select('accessedMaterials');
                const hasAccess = user.accessedMaterials.some(access =>
                    access.materialId.toString() === materialId
                );

                if (!hasAccess) {
                    throw {
                        status: HttpResponseCode.FORBIDDEN,
                        message: "Access denied. Verify access code before downloading",
                        statusCode: HttpResponse.forbidden
                    };
                }
            }

            // Check access for request-based materials before download
            if (material.accessType === 'request-based') {
                const isOwner = material.uploadedBy.toString() === userId;
                if (!isOwner) {
                    throw {
                        status: HttpResponseCode.FORBIDDEN,
                        message: "Access denied. Only the uploader can download request-based materials",
                        statusCode: HttpResponse.forbidden
                    };
                }
            }

            material.downloadCount += 1;
            await material.save();

            if (material.youtubeUrl) {
                return {
                    watchUrl: material.youtubeUrl,
                    material: this.formatMaterialResponse(material),
                    message: "YouTube video ready for viewing"
                };
            }

            return {
                downloadUrl: material.fileUrl,
                material: this.formatMaterialResponse(material),
                message: "Download ready"
            };

        } catch (exception) {
            throw exception;
        }
    };

    // NEW METHOD: Get materials I have access to (including verified private ones)
    getMyAccessedMaterials = async (userId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                ...queryFilters
            } = filters;

            // Get user's accessed material IDs
            const user = await UserModel.findById(userId).select('accessedMaterials');
            const accessedMaterialIds = user.accessedMaterials.map(access => access.materialId);

            let query = {
                _id: { $in: accessedMaterialIds },
                status: 'approved',
                ...queryFilters
            };

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find(query)
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .populate('uploadedBy', 'name email')
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                StudyMaterialModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                materials: materials.map(material => this.formatMaterialResponse(material)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMaterials: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    updateMaterial = async (materialId, data, userId, userRole) => {
        try {
            this.validateObjectId(materialId);

            const existingMaterial = await StudyMaterialModel.findById(materialId);
            if (!existingMaterial) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // ✅ FIXED: Proper ObjectId comparison
            const isOwner = existingMaterial.uploadedBy.toString() === userId.toString();

            // Check permissions: Admin can update any, Teacher only their own
            if (userRole !== 'admin' && !isOwner) {
                throw {
                    status: HttpResponseCode.FORBIDDEN,
                    message: "You can only update your own materials",
                    statusCode: HttpResponse.forbidden
                };
            }

            // Process YouTube data if provided
            if (data.youtubeUrl) {
                data.youtubeVideoId = this.extractYouTubeId(data.youtubeUrl);
                data.fileType = 'video';
                data.fileSize = data.fileSize || 0;
                data.thumbnail = this.getYouTubeThumbnail(data.youtubeVideoId);
            }

            // If content is modified by non-admin, require re-verification
            const contentModified = data.fileUrl || data.youtubeUrl || data.title || data.description;
            if (contentModified && userRole !== 'admin') {
                data.status = 'pending';
                data.verifiedBy = null;
                data.verifiedAt = null;
                data.rejectionReason = null;
            }

            const updatedMaterial = await StudyMaterialModel.findByIdAndUpdate(
                materialId,
                { $set: data },
                { new: true, runValidators: true }
            )
                .populate('faculty', 'name code')
                .populate('course', 'name code')
                .populate('uploadedBy', 'name email');

            return this.formatMaterialResponse(updatedMaterial);

        } catch (exception) {
            throw exception;
        }
    };

    deleteMaterial = async (materialId, userId, userRole) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId);

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Proper ObjectId comparison
            const isOwner = material.uploadedBy.toString() === userId.toString();

            // Admin can delete any, Teacher only their own
            if (userRole !== 'admin' && !isOwner) {
                throw {
                    status: HttpResponseCode.FORBIDDEN,
                    message: "You can only delete your own materials",
                    statusCode: HttpResponse.forbidden
                };
            }

            if (material.publicId) {
                await FileUploadService.deleteFile(material.publicId);
            }

            await StudyMaterialModel.findByIdAndDelete(materialId);

            return {
                message: "Material deleted successfully",
                materialId: materialId
            };

        } catch (exception) {
            throw exception;
        }
    };

    getMyMaterials = async (userId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                ...queryFilters
            } = filters;

            let query = { uploadedBy: userId, ...queryFilters };
            if (status) query.status = status;

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find(query)
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                StudyMaterialModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                materials: materials.map(material => this.formatMaterialResponse(material)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMaterials: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    getPendingMaterials = async (filters = {}) => {
        try {
            const { page = 1, limit = 10 } = filters;

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find({ status: 'pending' })
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .populate('uploadedBy', 'name email')
                    .sort({ createdAt: 1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                StudyMaterialModel.countDocuments({ status: 'pending' })
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                materials: materials.map(material => this.formatMaterialResponse(material)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalMaterials: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };

        } catch (exception) {
            throw exception;
        }
    };

    verifyMaterial = async (materialId, data, adminId) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId);

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (material.status !== 'pending') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Material is not pending verification",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const updateData = {
                status: data.status,
                verifiedBy: adminId,
                verifiedAt: new Date()
            };

            if (data.status === 'rejected' && data.rejectionReason) {
                updateData.rejectionReason = data.rejectionReason;
            } else {
                updateData.rejectionReason = null;
            }

            const updatedMaterial = await StudyMaterialModel.findByIdAndUpdate(
                materialId,
                { $set: updateData },
                { new: true }
            )
                .populate('faculty', 'name code')
                .populate('course', 'name code')
                .populate('uploadedBy', 'name email')
                .populate('verifiedBy', 'name email');

            return this.formatMaterialResponse(updatedMaterial);

        } catch (exception) {
            throw exception;
        }
    };

    adminDeleteMaterial = async (materialId) => {
        try {
            this.validateObjectId(materialId);

            const material = await StudyMaterialModel.findById(materialId);

            if (!material) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Material not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (material.publicId) {
                await FileUploadService.deleteFile(material.publicId);
            }

            await StudyMaterialModel.findByIdAndDelete(materialId);

            return {
                message: "Material deleted by admin successfully",
                materialId: materialId
            };

        } catch (exception) {
            throw exception;
        }
    };

    extractYouTubeId = (url) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    };

    getYouTubeThumbnail = (videoId) => {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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

    formatMaterialResponse = (material, fullDetails = false) => {
        const baseResponse = {
            _id: material._id,
            title: material.title,
            description: material.description,
            materialType: material.materialType,
            faculty: material.faculty,
            course: material.course,
            academicSystem: material.academicSystem,
            semester: material.semester,
            academicYear: material.academicYear,
            fileUrl: material.fileUrl,
            youtubeUrl: material.youtubeUrl,
            youtubeVideoId: material.youtubeVideoId,
            thumbnail: material.thumbnail,
            fileType: material.fileType,
            fileSize: material.fileSize,
            accessType: material.accessType,
            uploadedBy: material.uploadedBy,
            author: material.author,
            status: material.status,
            downloadCount: material.downloadCount,
            viewCount: material.viewCount,
            createdAt: material.createdAt
        };

        if (fullDetails) {
            return {
                ...baseResponse,
                verifiedBy: material.verifiedBy,
                verifiedAt: material.verifiedAt,
                rejectionReason: material.rejectionReason,
                updatedAt: material.updatedAt
            };
        }

        return baseResponse;
    };
}

const materialSvc = new MaterialService();
export default materialSvc;