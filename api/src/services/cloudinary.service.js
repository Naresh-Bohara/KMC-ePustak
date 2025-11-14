import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class FileUploadService {
    static async uploadFile(filePath, folder = "kmc-epustak") {
        try {
            const cloudinaryFile = await cloudinary.uploader.upload(filePath, {
                folder: folder,
                resource_type: "auto",
                unique_filename: true,
                overwrite: false
            });

            // Clean up temporary file
            this.cleanupFile(filePath);

            return {
                url: cloudinaryFile.url,
                public_id: cloudinaryFile.public_id,
                format: cloudinaryFile.format,
                bytes: cloudinaryFile.bytes,
                secure_url: cloudinaryFile.secure_url
            };

        } catch (exception) {
            this.cleanupFile(filePath);
            throw exception;
        }
    }

    static async uploadMaterial(filePath, faculty, course, materialType) {
        try {
            // Create organized folder structure
            const folderPath = `kmc-epustak/materials/${faculty}/${course}/${materialType}`;
            
            const result = await this.uploadFile(filePath, folderPath);
            return result;

        } catch (exception) {
            throw exception;
        }
    }

    static async uploadUserImage(filePath, userId) {
        try {
            const folderPath = `kmc-epustak/users/${userId}`;
            const result = await this.uploadFile(filePath, folderPath);
            return result;

        } catch (exception) {
            throw exception;
        }
    }

    static async uploadCourseImage(filePath, courseId) {
        try {
            const folderPath = `kmc-epustak/courses/${courseId}`;
            const result = await this.uploadFile(filePath, folderPath);
            return result;

        } catch (exception) {
            throw exception;
        }
    }

    static async deleteFile(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    static async deleteFolder(folderPath) {
        try {
            const result = await cloudinary.api.delete_folder(folderPath);
            return result;
        } catch (exception) {
            throw exception;
        }
    }

    static cleanupFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                
                // Also clean up empty parent directories
                const tempDir = path.dirname(filePath);
                const files = fs.readdirSync(tempDir);
                if (files.length === 0) {
                    fs.rmdirSync(tempDir);
                }
            }
        } catch (error) {
            console.warn("File cleanup warning:", error.message);
        }
    }

    static async getFolderContents(folderPath) {
        try {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: folderPath,
                max_results: 100
            });
            return result;
        } catch (exception) {
            throw exception;
        }
    }
}

export default FileUploadService;