import BookmarkModel from "./bookmark.model.js";
import StudyMaterialModel from "../material/material.model.js";
import UserModel from "../user/user.model.js";
import HttpResponse from "../../constants/response-status.contants.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";


class BookmarkService {
    
    addBookmark = async (materialId, userId) => {
        try {
            this.validateObjectId(materialId);

            // Check if material exists and is accessible
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

            // Check if user has access to private materials
            if (material.accessType === 'private') {
                const user = await UserModel.findById(userId).select('accessedMaterials');
                const hasAccess = user.accessedMaterials.some(access => 
                    access.materialId.toString() === materialId
                );
                
                if (!hasAccess) {
                    throw {
                        status: HttpResponseCode.FORBIDDEN,
                        message: "You need access to this material before bookmarking",
                        statusCode: HttpResponse.forbidden
                    };
                }
            }

            // Check if already bookmarked
            const existingBookmark = await BookmarkModel.findOne({
                user: userId,
                material: materialId
            });

            if (existingBookmark) {
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "Material already bookmarked",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Create bookmark
            const bookmark = new BookmarkModel({
                user: userId,
                material: materialId
            });

            const savedBookmark = await bookmark.save();

            // Populate material details
            await savedBookmark.populate([
                { 
                    path: 'material', 
                    select: 'title description materialType fileUrl youtubeUrl thumbnail accessType uploadedBy author viewCount downloadCount',
                    populate: [
                        { path: 'faculty', select: 'name code' },
                        { path: 'course', select: 'name code' },
                        { path: 'uploadedBy', select: 'name email' }
                    ]
                }
            ]);

            return {
                bookmark: this.formatBookmarkResponse(savedBookmark),
                message: "Material bookmarked successfully"
            };
            
        } catch (exception) {
            if (exception.code === 11000) { // Duplicate key error
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "Material already bookmarked",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    removeBookmark = async (materialId, userId) => {
        try {
            this.validateObjectId(materialId);

            const bookmark = await BookmarkModel.findOneAndDelete({
                user: userId,
                material: materialId
            });

            if (!bookmark) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Bookmark not found",
                    statusCode: HttpResponse.notFound
                };
            }

            return {
                materialId: materialId,
                message: "Bookmark removed successfully"
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    getUserBookmarks = async (userId, filters = {}) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                materialType,
                faculty,
                course,
                ...queryFilters 
            } = filters;

            let query = { user: userId, ...queryFilters };

            // Apply filters
            if (materialType) query.materialType = materialType;
            if (faculty) query.faculty = faculty;
            if (course) query.course = course;

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [bookmarks, total] = await Promise.all([
                BookmarkModel.find(query)
                    .populate([
                        { 
                            path: 'material', 
                            select: 'title description materialType fileUrl youtubeUrl thumbnail accessType uploadedBy author viewCount downloadCount createdAt',
                            populate: [
                                { path: 'faculty', select: 'name code' },
                                { path: 'course', select: 'name code' },
                                { path: 'uploadedBy', select: 'name email' }
                            ]
                        }
                    ])
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                BookmarkModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                bookmarks: bookmarks.map(bookmark => this.formatBookmarkResponse(bookmark)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBookmarks: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    getBookmarkStatus = async (materialId, userId) => {
        try {
            this.validateObjectId(materialId);

            const bookmark = await BookmarkModel.findOne({
                user: userId,
                material: materialId
            });

            return {
                isBookmarked: !!bookmark,
                materialId: materialId
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    // Get bookmark counts for a user
    getBookmarkStats = async (userId) => {
        try {
            const stats = await BookmarkModel.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: '$materialType',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalBookmarks = await BookmarkModel.countDocuments({ user: userId });

            return {
                totalBookmarks,
                byType: stats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    // Helper Methods
    validateObjectId = (id) => {
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Invalid ID format",
                statusCode: HttpResponse.validationFailed
            };
        }
    };

    formatBookmarkResponse = (bookmark) => {
        return {
            _id: bookmark._id,
            material: bookmark.material,
            materialType: bookmark.materialType,
            faculty: bookmark.faculty,
            course: bookmark.course,
            bookmarkedAt: bookmark.createdAt,
            createdAt: bookmark.createdAt
        };
    };
}

const bookmarkSvc = new BookmarkService();
export default bookmarkSvc;