import CourseModel from "./course.model.js";
import FacultyModel from "../faculty/faculty.model.js";
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";

class CourseService {
    
    createCourse = async (data) => {
        try {
            // Check if course with same code already exists
            const existingCourse = await CourseModel.findOne({
                code: data.code.toUpperCase()
            });

            if (existingCourse) {
                throw {
                    status: HttpResponseCode.CONFLICT, // 409 is better for duplicates
                    message: "Course with this code already exists",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Check if faculty exists and is active
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

            // Auto-uppercase course code
            const courseData = {
                ...data,
                code: data.code.toUpperCase()
            };

            const course = new CourseModel(courseData);
            const savedCourse = await course.save();

            // Populate before returning
            await savedCourse.populate('faculty', 'name code');

            return this.formatCourseResponse(savedCourse);
            
        } catch (exception) {
            if (exception.code === 11000) { // MongoDB duplicate key
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "Course code already exists",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    getCourses = async (filters = {}) => {
        try {
            const { 
                page = 1, 
                limit = 10, 
                sortBy = 'name', 
                sortOrder = 'asc',
                search,
                ...queryFilters 
            } = filters;
            
            // Build query
            let query = { ...queryFilters };
            
            // Default to active courses if no status filter
            if (!query.status) {
                query.status = 'active';
            }

            // Add search functionality
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { code: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ];
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

            // Execute query with pagination
            const [courses, total] = await Promise.all([
                CourseModel.find(query)
                    .populate('faculty', 'name code')
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit),
                CourseModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                courses: courses.map(course => this.formatCourseResponse(course)),
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCourses: total,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                    limit: parseInt(limit)
                }
            };
            
        } catch (exception) {
            throw exception;
        }
    };

    getCourseById = async (courseId) => {
        try {
            this.validateObjectId(courseId);

            const course = await CourseModel.findById(courseId)
                .populate('faculty', 'name code hod contactEmail');
            
            if (!course) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Course not found",
                    statusCode: HttpResponse.notFound
                };
            }

            return this.formatCourseResponse(course, true); // include full details
            
        } catch (exception) {
            if (exception.name === 'CastError') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Invalid course ID",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    updateCourse = async (courseId, data) => {
        try {
            this.validateObjectId(courseId);

            // Check if course exists
            const existingCourse = await CourseModel.findById(courseId);
            if (!existingCourse) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Course not found",
                    statusCode: HttpResponse.notFound
                };
            }

            // Check if updated code conflicts with existing courses
            if (data.code) {
                data.code = data.code.toUpperCase(); // Auto-uppercase
                
                const duplicateCourse = await CourseModel.findOne({
                    _id: { $ne: courseId },
                    code: data.code
                });

                if (duplicateCourse) {
                    throw {
                        status: HttpResponseCode.CONFLICT,
                        message: "Another course with this code already exists",
                        statusCode: HttpResponse.validationFailed
                    };
                }
            }

            // Handle academic system changes
            if (data.academicSystem) {
                if (data.academicSystem === 'semester') {
                    data.academicYear = null;
                } else {
                    data.semester = null;
                }
            }

            // Check faculty if being updated
            if (data.faculty) {
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
            }

            const updatedCourse = await CourseModel.findByIdAndUpdate(
                courseId,
                { $set: data },
                { new: true, runValidators: true }
            ).populate('faculty', 'name code');

            return this.formatCourseResponse(updatedCourse);
            
        } catch (exception) {
            if (exception.code === 11000) {
                throw {
                    status: HttpResponseCode.CONFLICT,
                    message: "Course code already exists",
                    statusCode: HttpResponse.validationFailed
                };
            }
            throw exception;
        }
    };

    deleteCourse = async (courseId) => {
        try {
            this.validateObjectId(courseId);

            const existingCourse = await CourseModel.findById(courseId);
            
            if (!existingCourse) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Course not found",
                    statusCode: HttpResponse.notFound
                };
            }

            if (existingCourse.status === 'inactive') {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Course is already deactivated",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const course = await CourseModel.findByIdAndUpdate(
                courseId,
                { status: 'inactive' },
                { new: true }
            ).populate('faculty', 'name code');

            return {
                ...this.formatCourseResponse(course),
                message: "Course has been deactivated successfully"
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

    formatCourseResponse = (course, fullDetails = false) => {
        const baseResponse = {
            _id: course._id,
            name: course.name,
            code: course.code,
            creditHours: course.creditHours,
            faculty: course.faculty,
            academicSystem: course.academicSystem,
            semester: course.semester,
            academicYear: course.academicYear,
            courseType: course.courseType,
            status: course.status
        };

        if (fullDetails) {
            return {
                ...baseResponse,
                description: course.description,
                createdAt: course.createdAt,
                updatedAt: course.updatedAt
            };
        }

        return baseResponse;
    };
}

const courseSvc = new CourseService();
export default courseSvc;