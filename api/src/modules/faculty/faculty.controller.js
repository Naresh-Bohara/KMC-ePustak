import HttpResponse from "../../constants/response-status.contants.js";
import facultySvc from "./faculty.service.js";

class FacultyController {

    createFaculty = async (req, res, next) => {
        try {
            const faculty = await facultySvc.createFaculty(req.body);

            res.json({
                data: {
                    _id: faculty._id,
                    name: faculty.name,
                    code: faculty.code,
                    hod: faculty.hod,
                    status: faculty.status
                },
                message: "Faculty created successfully",
                status: HttpResponse.success,
                options: null
            });

        } catch (exception) {
            next(exception);
        }
    };

    getFaculties = async (req, res, next) => {
        try {
            const result = await facultySvc.getFaculties(req.query);

            res.json({
                data: result.faculties,
                pagination: result.pagination,
                message: "Faculties retrieved successfully",
                status: HttpResponse.success,
                options: null
            });

        } catch (exception) {
            next(exception);
        }
    };

  getFacultyById = async (req, res, next) => {
    try {
        const faculty = await facultySvc.getFacultyById(req.params.id);

        res.json({
            data: faculty, 
            message: "Faculty details retrieved successfully",
            status: HttpResponse.success,
            options: null
        });
        
    } catch (exception) {
        next(exception);
    }
};

    updateFaculty = async (req, res, next) => {
        try {
            const faculty = await facultySvc.updateFaculty(req.params.id, req.body);

            res.json({
                data: {
                    _id: faculty._id,
                    name: faculty.name,
                    code: faculty.code,
                    hod: faculty.hod,
                    status: faculty.status
                },
                message: "Faculty updated successfully",
                status: HttpResponse.success,
                options: null
            });

        } catch (exception) {
            next(exception);
        }
    };

    deleteFaculty = async (req, res, next) => {
        try {
            const faculty = await facultySvc.deleteFaculty(req.params.id);

            res.json({
                data: {
                    _id: faculty._id,
                    name: faculty.name,
                    code: faculty.code,
                    status: faculty.status, // Will show 'inactive'
                    message: "Faculty has been deactivated"
                },
                message: "Faculty deleted successfully",
                status: HttpResponse.success,
                options: null
            });

        } catch (exception) {
            next(exception);
        }
    };

}

const facultyCtrl = new FacultyController();
export default facultyCtrl;