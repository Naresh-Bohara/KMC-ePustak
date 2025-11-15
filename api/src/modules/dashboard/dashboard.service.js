import StudyMaterialModel from "../material/material.model.js";
import UserModel from "../user/user.model.js";
import FacultyModel from "../faculty/faculty.model.js";
import CourseModel from "../course/course.model.js";
import BookmarkModel from "../bookmark/bookmark.model.js";

class DashboardService {

    // ADMIN DASHBOARD 

    getAdminStats = async () => {
        try {
            const [
                totalUsers,
                totalTeachers,
                totalStudents,
                totalMaterials,
                pendingMaterials,
                totalFaculties,
                totalCourses,
                totalDownloads,
                totalViews
            ] = await Promise.all([
                UserModel.countDocuments(),
                UserModel.countDocuments({ role: 'teacher' }),
                UserModel.countDocuments({ role: 'student' }),
                StudyMaterialModel.countDocuments(),
                StudyMaterialModel.countDocuments({ status: 'pending' }),
                FacultyModel.countDocuments({ status: 'active' }),
                CourseModel.countDocuments({ status: 'active' }),
                StudyMaterialModel.aggregate([{ $group: { _id: null, total: { $sum: '$downloadCount' } } }]),
                StudyMaterialModel.aggregate([{ $group: { _id: null, total: { $sum: '$viewCount' } } }])
            ]);

            // Calculate storage usage (estimate)
            const storageStats = await StudyMaterialModel.aggregate([
                { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
            ]);

            const totalStorage = storageStats[0]?.totalSize || 0;

            return {
                users: {
                    total: totalUsers,
                    teachers: totalTeachers,
                    students: totalStudents,
                    pendingTeachers: await UserModel.countDocuments({ role: 'teacher', status: 'pending' })
                },
                materials: {
                    total: totalMaterials,
                    pending: pendingMaterials,
                    approved: await StudyMaterialModel.countDocuments({ status: 'approved' }),
                    rejected: await StudyMaterialModel.countDocuments({ status: 'rejected' })
                },
                academics: {
                    faculties: totalFaculties,
                    courses: totalCourses
                },
                engagement: {
                    totalDownloads: totalDownloads[0]?.total || 0,
                    totalViews: totalViews[0]?.total || 0,
                    storageUsed: this.formatFileSize(totalStorage)
                },
                recentGrowth: await this.getRecentGrowth()
            };

        } catch (exception) {
            throw exception;
        }
    };

    getAdminActivities = async () => {
        try {
            const recentMaterials = await StudyMaterialModel.find()
                .populate('uploadedBy', 'name email')
                .populate('faculty', 'name')
                .sort({ createdAt: -1 })
                .limit(10);

            const recentUsers = await UserModel.find()
                .select('name email role createdAt')
                .sort({ createdAt: -1 })
                .limit(5);

            return {
                recentUploads: recentMaterials.map(material => ({
                    _id: material._id,
                    title: material.title,
                    type: material.materialType,
                    faculty: material.faculty?.name,
                    uploadedBy: material.uploadedBy?.name,
                    status: material.status,
                    createdAt: material.createdAt
                })),
                recentRegistrations: recentUsers.map(user => ({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    joinedAt: user.createdAt
                })),
                lastUpdated: new Date()
            };

        } catch (exception) {
            throw exception;
        }
    };

    getFacultyAnalytics = async () => {
        try {
            const facultyStats = await StudyMaterialModel.aggregate([
                { $match: { status: 'approved' } },
                {
                    $group: {
                        _id: '$faculty',
                        materialCount: { $sum: 1 },
                        totalViews: { $sum: '$viewCount' },
                        totalDownloads: { $sum: '$downloadCount' },
                        avgRating: { $avg: '$rating' }
                    }
                },
                {
                    $lookup: {
                        from: 'faculties',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'facultyInfo'
                    }
                },
                { $unwind: '$facultyInfo' },
                {
                    $project: {
                        faculty: {
                            _id: '$_id',
                            name: '$facultyInfo.name',
                            code: '$facultyInfo.code'
                        },
                        materialCount: 1,
                        totalViews: 1,
                        totalDownloads: 1,
                        engagementRate: {
                            $cond: [
                                { $eq: ['$totalViews', 0] },
                                0,
                                { $divide: ['$totalDownloads', '$totalViews'] }
                            ]
                        }
                    }
                },
                { $sort: { totalViews: -1 } }
            ]);

            return facultyStats;

        } catch (exception) {
            throw exception;
        }
    };

    // TEACHER DASHBOARD 
    getTeacherStats = async (teacherId) => {
        try {
            const [
                totalMaterials,
                approvedMaterials,
                pendingMaterials,
                totalViews,
                totalDownloads,
                recentPerformance
            ] = await Promise.all([
                StudyMaterialModel.countDocuments({ uploadedBy: teacherId }),
                StudyMaterialModel.countDocuments({ uploadedBy: teacherId, status: 'approved' }),
                StudyMaterialModel.countDocuments({ uploadedBy: teacherId, status: 'pending' }),
                StudyMaterialModel.aggregate([
                    { $match: { uploadedBy: teacherId } },
                    { $group: { _id: null, total: { $sum: '$viewCount' } } }
                ]),
                StudyMaterialModel.aggregate([
                    { $match: { uploadedBy: teacherId } },
                    { $group: { _id: null, total: { $sum: '$downloadCount' } } }
                ]),
                this.getTeacherRecentPerformance(teacherId)
            ]);

            return {
                materials: {
                    total: totalMaterials,
                    approved: approvedMaterials,
                    pending: pendingMaterials,
                    rejected: await StudyMaterialModel.countDocuments({ uploadedBy: teacherId, status: 'rejected' })
                },
                engagement: {
                    totalViews: totalViews[0]?.total || 0,
                    totalDownloads: totalDownloads[0]?.total || 0,
                    avgViewsPerMaterial: totalMaterials > 0 ? Math.round((totalViews[0]?.total || 0) / totalMaterials) : 0
                },
                performance: recentPerformance
            };

        } catch (exception) {
            throw exception;
        }
    };

    getTeacherMaterials = async (teacherId, filters = {}) => {
        try {
            const {
                page = 1,
                limit = 5,
                status = 'all',
                sortBy = 'createdAt',
                sortOrder = 'desc',
                ...queryFilters
            } = filters;

            let query = { uploadedBy: teacherId, ...queryFilters };

            if (status !== 'all') {
                query.status = status;
            }

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find(query)
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
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

    getTeacherPerformance = async (teacherId) => {
        try {
            const performance = await StudyMaterialModel.aggregate([
                { $match: { uploadedBy: teacherId, status: 'approved' } },
                {
                    $group: {
                        _id: '$materialType',
                        count: { $sum: 1 },
                        totalViews: { $sum: '$viewCount' },
                        totalDownloads: { $sum: '$downloadCount' },
                        avgViews: { $avg: '$viewCount' },
                        avgDownloads: { $avg: '$downloadCount' }
                    }
                },
                { $sort: { totalViews: -1 } }
            ]);

            const topMaterials = await StudyMaterialModel.find({ uploadedBy: teacherId })
                .select('title viewCount downloadCount materialType createdAt')
                .sort({ viewCount: -1 })
                .limit(5);

            return {
                byMaterialType: performance,
                topPerforming: topMaterials,
                weeklyTrend: await this.getTeacherWeeklyTrend(teacherId)
            };

        } catch (exception) {
            throw exception;
        }
    };

    //  STUDENT DASHBOARD 

    getStudentOverview = async (studentId) => {
        try {
            const user = await UserModel.findById(studentId)
                .select('studentProfile name email')
                .populate('studentProfile.faculty', 'name code');

            const [
                bookmarksCount,
                recentViews,
                facultyMaterials
            ] = await Promise.all([
                BookmarkModel.countDocuments({ user: studentId }),
                StudyMaterialModel.find({ viewCount: { $gt: 0 } })
                    .select('title materialType viewCount')
                    .sort({ viewCount: -1 })
                    .limit(5),
                StudyMaterialModel.countDocuments({
                    faculty: user.studentProfile?.faculty,
                    status: 'approved'
                })
            ]);

            return {
                profile: {
                    name: user.name,
                    faculty: user.studentProfile?.faculty,
                    academicSystem: user.studentProfile?.academicSystem,
                    semester: user.studentProfile?.semester,
                    academicYear: user.studentProfile?.academicYear
                },
                learning: {
                    bookmarks: bookmarksCount,
                    recentlyViewed: recentViews,
                    availableMaterials: facultyMaterials
                },
                recommendations: await this.getStudentRecommendations(studentId, user)
            };

        } catch (exception) {
            throw exception;
        }
    };

    getStudentRecentMaterials = async (studentId) => {
        try {
            // Get materials from student's faculty and semester
            const user = await UserModel.findById(studentId)
                .select('studentProfile')
                .populate('studentProfile.faculty');

            if (!user.studentProfile?.faculty) {
                return [];
            }

            const query = {
                faculty: user.studentProfile.faculty._id,
                status: 'approved',
                accessType: 'public'
            };

            // Add semester/year filter based on academic system
            if (user.studentProfile.academicSystem === 'semester' && user.studentProfile.semester) {
                query.semester = user.studentProfile.semester;
            } else if (user.studentProfile.academicSystem === 'yearly' && user.studentProfile.academicYear) {
                query.academicYear = user.studentProfile.academicYear;
            }

            const materials = await StudyMaterialModel.find(query)
                .populate('faculty', 'name code')
                .populate('course', 'name code')
                .populate('uploadedBy', 'name')
                .sort({ createdAt: -1 })
                .limit(10);

            return materials.map(material => this.formatMaterialResponse(material));

        } catch (exception) {
            throw exception;
        }
    };

    // COMMON DASHBOARD 

    getRecentActivities = async () => {
        try {
            const recentActivities = await StudyMaterialModel.find({ status: 'approved' })
                .populate('uploadedBy', 'name')
                .populate('faculty', 'name')
                .select('title materialType uploadedBy faculty createdAt')
                .sort({ createdAt: -1 })
                .limit(15);

            return recentActivities.map(activity => ({
                _id: activity._id,
                title: activity.title,
                type: activity.materialType,
                uploadedBy: activity.uploadedBy?.name,
                faculty: activity.faculty?.name,
                action: 'uploaded',
                timestamp: activity.createdAt
            }));

        } catch (exception) {
            throw exception;
        }
    };

    getPopularMaterials = async (filters = {}) => {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'viewCount',
                sortOrder = 'desc',
                period = 'month',
                faculty,
                materialType,
                ...queryFilters
            } = filters;

            let query = { status: 'approved', ...queryFilters };

            // Apply time period filter
            if (period !== 'all') {
                const dateFilter = this.getDateFilter(period);
                query.createdAt = { $gte: dateFilter };
            }

            if (faculty) query.faculty = faculty;
            if (materialType) query.materialType = materialType;

            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            const [materials, total] = await Promise.all([
                StudyMaterialModel.find(query)
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .populate('uploadedBy', 'name')
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

    // HELPER METHODS 

    getRecentGrowth = async () => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [
            newUsersThisWeek,
            newMaterialsThisWeek
        ] = await Promise.all([
            UserModel.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
            StudyMaterialModel.countDocuments({ createdAt: { $gte: oneWeekAgo }, status: 'approved' })
        ]);

        return {
            newUsers: newUsersThisWeek,
            newMaterials: newMaterialsThisWeek,
            period: 'last_7_days'
        };
    };

    getTeacherRecentPerformance = async (teacherId) => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const monthlyStats = await StudyMaterialModel.aggregate([
            {
                $match: {
                    uploadedBy: teacherId,
                    createdAt: { $gte: oneMonthAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    materialsAdded: { $sum: 1 },
                    totalViews: { $sum: '$viewCount' },
                    totalDownloads: { $sum: '$downloadCount' }
                }
            }
        ]);

        return monthlyStats[0] || { materialsAdded: 0, totalViews: 0, totalDownloads: 0 };
    };

    getTeacherWeeklyTrend = async (teacherId) => {
        try {
            const last4Weeks = new Date();
            last4Weeks.setDate(last4Weeks.getDate() - 28); // 4 weeks back

            const weeklyTrend = await StudyMaterialModel.aggregate([
                {
                    $match: {
                        uploadedBy: teacherId,
                        createdAt: { $gte: last4Weeks }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            week: { $week: '$createdAt' }
                        },
                        materialsAdded: { $sum: 1 },
                        totalViews: { $sum: '$viewCount' },
                        totalDownloads: { $sum: '$downloadCount' },
                        weekStart: { $min: '$createdAt' }
                    }
                },
                { $sort: { 'weekStart': 1 } },
                { $limit: 4 }
            ]);

            // Format the response
            return weeklyTrend.map(week => ({
                week: `Week ${week._id.week}`,
                period: week.weekStart,
                materialsAdded: week.materialsAdded,
                totalViews: week.totalViews,
                totalDownloads: week.totalDownloads,
                engagement: week.totalViews > 0 ? Math.round((week.totalDownloads / week.totalViews) * 100) : 0
            }));

        } catch (exception) {
            console.error('Error getting teacher weekly trend:', exception);
            return [];
        }
    };

    getStudentRecommendations = async (studentId, user) => {
        try {
            if (!user.studentProfile?.faculty) {
                return [];
            }

            const studentFaculty = user.studentProfile.faculty;
            const studentSemester = user.studentProfile.semester;
            const studentAcademicYear = user.studentProfile.academicYear;

            // Get materials from same faculty and academic level
            let query = {
                faculty: studentFaculty,
                status: 'approved',
                accessType: 'public'
            };

            // Add academic level filter
            if (user.studentProfile.academicSystem === 'semester' && studentSemester) {
                query.semester = studentSemester;
            } else if (user.studentProfile.academicSystem === 'yearly' && studentAcademicYear) {
                query.academicYear = studentAcademicYear;
            }

            // Get popular materials from student's faculty and level
            const recommendations = await StudyMaterialModel.find(query)
                .populate('faculty', 'name code')
                .populate('course', 'name code')
                .populate('uploadedBy', 'name')
                .select('title description materialType viewCount downloadCount fileUrl thumbnail')
                .sort({ viewCount: -1, downloadCount: -1 })
                .limit(6);

            // Get bookmarked material types to personalize recommendations
            const bookmarkedTypes = await BookmarkModel.aggregate([
                { $match: { user: studentId } },
                {
                    $lookup: {
                        from: 'studymaterials',
                        localField: 'material',
                        foreignField: '_id',
                        as: 'materialData'
                    }
                },
                { $unwind: '$materialData' },
                {
                    $group: {
                        _id: '$materialData.materialType',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 3 }
            ]);

            // If student has bookmarks, prioritize those material types
            if (bookmarkedTypes.length > 0) {
                const preferredTypes = bookmarkedTypes.map(type => type._id);

                const personalizedRecs = await StudyMaterialModel.find({
                    ...query,
                    materialType: { $in: preferredTypes }
                })
                    .populate('faculty', 'name code')
                    .populate('course', 'name code')
                    .populate('uploadedBy', 'name')
                    .select('title description materialType viewCount downloadCount fileUrl thumbnail')
                    .sort({ viewCount: -1 })
                    .limit(4);

                // Combine and deduplicate recommendations
                const allRecs = [...personalizedRecs, ...recommendations];
                const uniqueRecs = allRecs.filter((rec, index, self) =>
                    index === self.findIndex(r => r._id.toString() === rec._id.toString())
                );

                return uniqueRecs.slice(0, 6).map(material => this.formatMaterialResponse(material));
            }

            return recommendations.map(material => this.formatMaterialResponse(material));

        } catch (exception) {
            console.error('Error getting student recommendations:', exception);
            return [];
        }
    };

    getDateFilter = (period) => {
        const now = new Date();
        switch (period) {
            case 'today':
                return new Date(now.setHours(0, 0, 0, 0));
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 1));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(0); // Beginning of time
        }
    };

    formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    formatMaterialResponse = (material) => {
        return {
            _id: material._id,
            title: material.title,
            description: material.description,
            materialType: material.materialType,
            faculty: material.faculty,
            course: material.course,
            fileUrl: material.fileUrl,
            youtubeUrl: material.youtubeUrl,
            thumbnail: material.thumbnail,
            accessType: material.accessType,
            uploadedBy: material.uploadedBy,
            viewCount: material.viewCount,
            downloadCount: material.downloadCount,
            createdAt: material.createdAt
        };
    };
}

const dashboardSvc = new DashboardService();
export default dashboardSvc;