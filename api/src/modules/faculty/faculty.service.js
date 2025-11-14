
import HttpResponseCode from "../../constants/http-status-code.contants.js";
import HttpResponse from "../../constants/response-status.contants.js";
import FacultyModel from "./faculty.model.js";

class FacultyService {
    
    createFaculty = async (data) => {
        try {
            // Check if faculty with same code or name already exists
            const existingFaculty = await FacultyModel.findOne({
                $or: [
                    { code: data.code },
                    { name: data.name }
                ]
            });

            if (existingFaculty) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Faculty with this code or name already exists",
                    statusCode: HttpResponse.validationFailed
                };
            }

            const faculty = new FacultyModel(data);
            return await faculty.save();
            
        } catch (exception) {
            throw exception;
        }
    };

    getFaculties = async (filters = {}) => {
    try {
        let query = { ...filters };
        
        // Remove pagination and sorting from query
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const sortBy = query.sortBy || 'name';
        const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
        
        delete query.page;
        delete query.limit;
        delete query.sortBy;
        delete query.sortOrder;
        
        // Default to active faculties if no status filter
        if (!query.status) {
            query.status = 'active';
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder;

        // Get faculties with pagination
        const faculties = await FacultyModel.find(query)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(limit);

        // Get total count for pagination info
        const total = await FacultyModel.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        return {
            faculties,
            pagination: {
                currentPage: page,
                totalPages,
                totalFaculties: total,
                hasNext: page < totalPages,
                hasPrev: page > 1,
                limit
            }
        };
        
    } catch (exception) {
        throw exception;
    }
};

 getFacultyById = async (facultyId) => {
    try {
        // Validate ObjectId format
        if (!facultyId || !facultyId.match(/^[0-9a-fA-F]{24}$/)) {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Invalid faculty ID format",
                statusCode: HttpResponse.validationFailed,
                details: "Faculty ID must be a valid 24-character hexadecimal string"
            };
        }

        const faculty = await FacultyModel.findById(facultyId);
        
        if (!faculty) {
            throw {
                status: HttpResponseCode.NOT_FOUND,
                message: "Faculty not found",
                statusCode: HttpResponse.notFound,
                details: `No faculty found with ID: ${facultyId}`
            };
        }

        // Check if faculty is active (optional)
        if (faculty.status === 'inactive') {
            throw {
                status: HttpResponseCode.NOT_FOUND,
                message: "Faculty not available",
                statusCode: HttpResponse.notFound,
                details: "This faculty has been deactivated"
            };
        }

        // ✅ Format the faculty data in service layer
        const formattedFaculty = {
            _id: faculty._id,
            name: faculty.name,
            code: faculty.code,
            description: faculty.description,
            establishedYear: faculty.establishedYear,
            hod: faculty.hod,
            contactEmail: faculty.contactEmail,
            contactPhone: faculty.contactPhone,
            status: faculty.status,
            createdAt: faculty.createdAt,
            updatedAt: faculty.updatedAt
        };

        return formattedFaculty;
        
    } catch (exception) {
        if (exception.name === 'CastError') {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Invalid faculty ID",
                statusCode: HttpResponse.validationFailed,
                details: "The provided faculty ID is not valid"
            };
        }
        throw exception;
    }
};

    updateFaculty = async (facultyId, data) => {
        try {
            // Validate ObjectId format
            if (!facultyId.match(/^[0-9a-fA-F]{24}$/)) {
                throw {
                    status: HttpResponseCode.BAD_REQUEST,
                    message: "Invalid faculty ID format",
                    statusCode: HttpResponse.validationFailed
                };
            }

            // Check if updated code/name conflicts with existing faculties
            if (data.code || data.name) {
                const existingFaculty = await FacultyModel.findOne({
                    _id: { $ne: facultyId },
                    $or: [
                        { code: data.code },
                        { name: data.name }
                    ]
                });

                if (existingFaculty) {
                    throw {
                        status: HttpResponseCode.BAD_REQUEST,
                        message: "Another faculty with this code or name already exists",
                        statusCode: HttpResponse.validationFailed
                    };
                }
            }

            const faculty = await FacultyModel.findByIdAndUpdate(
                facultyId,
                { $set: data },
                { new: true, runValidators: true }
            );

            if (!faculty) {
                throw {
                    status: HttpResponseCode.NOT_FOUND,
                    message: "Faculty not found",
                    statusCode: HttpResponse.notFound
                };
            }

            return faculty;
            
        } catch (exception) {
            throw exception;
        }
    };

 deleteFaculty = async (facultyId) => {
    try {
        // Validate ObjectId format
        if (!facultyId.match(/^[0-9a-fA-F]{24}$/)) {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Invalid faculty ID format",
                statusCode: HttpResponse.validationFailed
            };
        }

        // Check if faculty exists and is active
        const existingFaculty = await FacultyModel.findById(facultyId);
        
        if (!existingFaculty) {
            throw {
                status: HttpResponseCode.NOT_FOUND,
                message: "Faculty not found",
                statusCode: HttpResponse.notFound
            };
        }

        // Check if already inactive
        if (existingFaculty.status === 'inactive') {
            throw {
                status: HttpResponseCode.BAD_REQUEST,
                message: "Faculty is already deleted",
                statusCode: HttpResponse.validationFailed
            };
        }

        // Soft delete - set status to inactive
        const faculty = await FacultyModel.findByIdAndUpdate(
            facultyId,
            { $set: { status: 'inactive' } },
            { new: true }
        );

        return faculty;
        
    } catch (exception) {
        throw exception;
    }
};
}

const facultySvc = new FacultyService();
export default facultySvc;