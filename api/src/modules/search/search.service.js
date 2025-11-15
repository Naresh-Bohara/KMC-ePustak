import StudyMaterialModel from "../material/material.model.js";
import FacultyModel from "../faculty/faculty.model.js";
import CourseModel from "../course/course.model.js";
import UserModel from "../user/user.model.js";

class SearchService {
    
    searchMaterials = async (filters = {}, userId, userRole) => {
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
                uploadedBy,
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
                            { accessType: 'request-based' }
                        ]
                    }
                ];
            }

            // Apply filters
            if (materialType) query.materialType = materialType;
            if (faculty) query.faculty = faculty;
            if (course) query.course = course;
            if (academicSystem) query.academicSystem = academicSystem;
            if (semester) query.semester = semester;
            if (academicYear) query.academicYear = academicYear;
            if (accessType) query.accessType = accessType;
            if (uploadedBy) query.uploadedBy = uploadedBy;

            // Advanced search across multiple fields
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { author: { $regex: search, $options: 'i' } },
                    { 'faculty.name': { $regex: search, $options: 'i' } },
                    { 'course.name': { $regex: search, $options: 'i' } }
                ];
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute search with pagination
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
                },
                filters: {
                    search: search || '',
                    materialType: materialType || '',
                    faculty: faculty || '',
                    course: course || '',
                    academicSystem: academicSystem || '',
                    semester: semester || '',
                    academicYear: academicYear || '',
                    accessType: accessType || ''
                }
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    getSearchFilters = async () => {
        try {
            const [faculties, courses, materialTypes, academicSystems] = await Promise.all([
                // Get active faculties
                FacultyModel.find({ status: 'active' }).select('name code').sort({ name: 1 }),
                
                // Get active courses
                CourseModel.find({ status: 'active' }).select('name code faculty').populate('faculty', 'name').sort({ name: 1 }),
                
                // Get unique material types from existing materials
                StudyMaterialModel.distinct('materialType'),
                
                // Get unique academic systems
                StudyMaterialModel.distinct('academicSystem')
            ]);

            // Get semesters and academic years ranges
            const [semesters, academicYears] = await Promise.all([
                StudyMaterialModel.distinct('semester').then(sems => sems.filter(sem => sem !== null).sort()),
                StudyMaterialModel.distinct('academicYear').then(years => years.filter(year => year !== null).sort())
            ]);

            // Get access types
            const accessTypes = await StudyMaterialModel.distinct('accessType');

            return {
                faculties: faculties.map(faculty => ({
                    _id: faculty._id,
                    name: faculty.name,
                    code: faculty.code
                })),
                courses: courses.map(course => ({
                    _id: course._id,
                    name: course.name,
                    code: course.code,
                    faculty: course.faculty
                })),
                materialTypes: materialTypes.sort(),
                academicSystems: academicSystems.sort(),
                semesters,
                academicYears,
                accessTypes: accessTypes.sort(),
                sortOptions: [
                    { value: 'createdAt', label: 'Newest First' },
                    { value: '-createdAt', label: 'Oldest First' },
                    { value: 'title', label: 'Title A-Z' },
                    { value: '-title', label: 'Title Z-A' },
                    { value: 'viewCount', label: 'Most Viewed' },
                    { value: 'downloadCount', label: 'Most Downloaded' }
                ]
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    formatMaterialResponse = (material) => {
        return {
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
    };
}

const searchSvc = new SearchService();
export default searchSvc;