import multer from "multer";
import fs from "fs";
import path from "path";
import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";

const ensureUploadDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = "./uploads/temp";
        ensureUploadDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const ext = path.extname(file.originalname);
        cb(null, `${timestamp}_${randomString}${ext}`);
    }
});

const uploadFile = (filetype = "image") => {
    const typeFilter = (req, file, cb) => {
        const ext = file.originalname.split(".").pop().toLowerCase();

        if (filetype === "image" && ['jpg', 'jpeg', 'png', 'svg', 'bmp', 'webp'].includes(ext)) {
            cb(null, true);
        } else if (filetype === "doc" && ['txt', 'pdf', 'csv', 'xlsx', 'json', 'xls', 'ppt', 'pptx', 'doc', 'docx'].includes(ext)) {
            cb(null, true);
        } else if (filetype === "materials" && ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'zip', 'txt'].includes(ext)) {
            cb(null, true);
        } else if (filetype === "video" && ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext)) {
            cb(null, true);
        } else {
            cb({
                status: HttpResponseCode.BAD_REQUEST,
                message: `File format .${ext} not supported for ${filetype} upload`,
                code: HttpResponse.validationFailed
            });
        }
    };

    const getFileSizeLimit = () => {
        switch (filetype) {
            case "image":
                return 5 * 1024 * 1024;
            case "doc":
                return 10 * 1024 * 1024;
            case "materials":
                return 50 * 1024 * 1024;
            case "video":
                return 100 * 1024 * 1024;
            default:
                return 5 * 1024 * 1024;
        }
    };

    return multer({
        storage: storage,
        fileFilter: typeFilter,
        limits: {
            fileSize: getFileSizeLimit()
        }
    });
};

export { uploadFile };