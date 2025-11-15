import materialSvc from "./material.service.js";
import FileUploadService from "../../services/cloudinary.service.js";
import HttpResponse from "../../constants/response-status.contants.js";


class MaterialController {
    
    uploadFile = async (req, res, next) => {
        try {
            if (!req.file) {
                throw {
                    status: 400,
                    message: "No file uploaded",
                    statusCode: HttpResponse.validationFailed
                };
            }

            let folder = 'kmc-epustak/materials';
            let message = "Study material uploaded successfully";

            if (req.originalUrl.includes('/upload/image')) {
                folder = 'kmc-epustak/images';
                message = "Image uploaded successfully";
            } else if (req.originalUrl.includes('/upload/doc')) {
                folder = 'kmc-epustak/documents';
                message = "Document uploaded successfully";
            }

            const uploadResult = await FileUploadService.uploadFile(
                req.file.path,
                folder
            );

            res.json({
                data: {
                    fileUrl: uploadResult.secure_url,
                    fileName: req.file.originalname,
                    fileSize: uploadResult.bytes,
                    fileType: req.file.originalname.split('.').pop().toLowerCase(),
                    publicId: uploadResult.public_id
                },
                message: message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    createMaterial = async (req, res, next) => {
        try {
            const material = await materialSvc.createMaterial(req.body, req.loggedInUser._id);
            
            res.status(201).json({
                data: material,
                message: "Material created successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getMaterials = async (req, res, next) => {
        try {
            const result = await materialSvc.getMaterials(req.query, req.loggedInUser._id, req.loggedInUser.role);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: result.materials.length > 0 
                    ? "Materials retrieved successfully" 
                    : "No materials found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getMaterialById = async (req, res, next) => {
        try {
            const material = await materialSvc.getMaterialById(req.params.id, req.loggedInUser._id);
            
            res.json({
                data: material,
                message: "Material details retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    validateAccess = async (req, res, next) => {
        try {
            const result = await materialSvc.validateAccess(
                req.params.id, 
                req.body.accessCode, 
                req.loggedInUser._id
            );
            
            res.json({
                data: result,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    downloadMaterial = async (req, res, next) => {
        try {
            const result = await materialSvc.downloadMaterial(req.params.id, req.loggedInUser._id);
            
            res.json({
                data: result,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    updateMaterial = async (req, res, next) => {
    try {
        const material = await materialSvc.updateMaterial(
            req.params.id, 
            req.body, 
            req.loggedInUser._id,
            req.loggedInUser.role 
        );
        
        res.json({
            data: material,
            message: "Material updated successfully",
            status: HttpResponse.success,
            options: null
        });
        
    } catch (exception) {
        next(exception);
    }
};

    deleteMaterial = async (req, res, next) => {
    try {
        const result = await materialSvc.deleteMaterial(
            req.params.id, 
            req.loggedInUser._id,
            req.loggedInUser.role 
        );
        
        res.json({
            data: result,
            message: result.message,
            status: HttpResponse.success,
            options: null
        });
        
    } catch (exception) {
        next(exception);
    }
};

    getMyMaterials = async (req, res, next) => {
        try {
            const result = await materialSvc.getMyMaterials(req.loggedInUser._id, req.query);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: "Your materials retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getPendingMaterials = async (req, res, next) => {
        try {
            const result = await materialSvc.getPendingMaterials(req.query);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: "Pending materials retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    verifyMaterial = async (req, res, next) => {
        try {
            const material = await materialSvc.verifyMaterial(
                req.params.id, 
                req.body, 
                req.loggedInUser._id
            );
            
            res.json({
                data: material,
                message: `Material ${req.body.status} successfully`,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    adminDeleteMaterial = async (req, res, next) => {
        try {
            const result = await materialSvc.adminDeleteMaterial(req.params.id);
            
            res.json({
                data: result,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    // NEW METHOD: Get materials I have access to (including verified private ones)
    getMyAccessedMaterials = async (req, res, next) => {
        try {
            const result = await materialSvc.getMyAccessedMaterials(req.loggedInUser._id, req.query);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                message: "Accessed materials retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const materialCtrl = new MaterialController();
export default materialCtrl;