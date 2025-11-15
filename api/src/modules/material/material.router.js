import { Router } from "express";
import { bodyValidator } from "../../middlewares/request-validator.middleware.js";
import { 
  createMaterialDTO, 
  updateMaterialDTO, 
  verifyMaterialDTO, 
  accessCodeDTO 
} from "./material.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import { Require } from "../../middlewares/rbac.middleware.js";
import materialCtrl from "./material.controller.js";
import { uploadFile } from "../../middlewares/multipart-parser.middleware.js";

const materialRouter = Router();

// Upload routes (Teacher only - upload is different from create)
materialRouter.post("/upload", checkLogin, Require.Teacher, uploadFile("materials").single('file'), materialCtrl.uploadFile);
materialRouter.post("/upload/image", checkLogin, Require.Teacher, uploadFile("image").single('file'), materialCtrl.uploadFile);
materialRouter.post("/upload/doc", checkLogin, Require.Teacher, uploadFile("doc").single('file'), materialCtrl.uploadFile);

// Create material (Both Teacher & Admin)
materialRouter.post("/", checkLogin, Require.AdminOrTeacher, bodyValidator(createMaterialDTO), materialCtrl.createMaterial);

// Get all materials (All authenticated users)
materialRouter.get("/", checkLogin, materialCtrl.getMaterials);

// Get material by ID (All authenticated users)
materialRouter.get("/:id", checkLogin, materialCtrl.getMaterialById);

// Validate access code (All authenticated users)
materialRouter.post("/:id/validate-access", checkLogin, bodyValidator(accessCodeDTO), materialCtrl.validateAccess);

// Download material (All authenticated users with access)
materialRouter.post("/:id/download", checkLogin, materialCtrl.downloadMaterial);

// Update material (Both Teacher & Admin)
materialRouter.put("/:id", checkLogin, Require.AdminOrTeacher, bodyValidator(updateMaterialDTO), materialCtrl.updateMaterial);

// Delete material (Both Teacher & Admin)
materialRouter.delete("/:id", checkLogin, Require.AdminOrTeacher, materialCtrl.deleteMaterial);

// Teacher's materials (Teacher only - personal dashboard)
materialRouter.get("/teacher/my-materials", checkLogin, Require.Teacher, materialCtrl.getMyMaterials);

// My accessed materials (All authenticated users - materials I have access to including private ones)
materialRouter.get("/user/accessed-materials", checkLogin, materialCtrl.getMyAccessedMaterials);

// Admin routes (Admin only)
materialRouter.get("/admin/pending", checkLogin, Require.Admin, materialCtrl.getPendingMaterials);
materialRouter.post("/admin/verify/:id", checkLogin, Require.Admin, bodyValidator(verifyMaterialDTO), materialCtrl.verifyMaterial);
materialRouter.delete("/admin/:id", checkLogin, Require.Admin, materialCtrl.adminDeleteMaterial);

export default materialRouter;