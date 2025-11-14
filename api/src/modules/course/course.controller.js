import HttpResponse from "../../constants/response-status.contants.js";
import courseSvc from "./course.service.js";

class CourseController {
    
    createCourse = async (req, res, next) => {
        try {
            const course = await courseSvc.createCourse(req.body);
            
            res.status(201).json({
                data: course,
                message: "Course created successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getCourses = async (req, res, next) => {
        try {
            const result = await courseSvc.getCourses(req.query);
            
            res.json({
                data: result.courses,
                pagination: result.pagination,
                message: result.courses.length > 0 
                    ? "Courses retrieved successfully" 
                    : "No courses found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getCourseById = async (req, res, next) => {
        try {
            const course = await courseSvc.getCourseById(req.params.id);
            
            res.json({
                data: course,
                message: "Course details retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    updateCourse = async (req, res, next) => {
        try {
            const course = await courseSvc.updateCourse(req.params.id, req.body);
            
            res.json({
                data: course,
                message: "Course updated successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    deleteCourse = async (req, res, next) => {
        try {
            const result = await courseSvc.deleteCourse(req.params.id);
            
            res.json({
                data: result,
                message: result.message || "Course deleted successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const courseCtrl = new CourseController();
export default courseCtrl;