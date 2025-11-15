import { Router } from "express";
import { bodyValidator, queryValidator } from "../../middlewares/request-validator.middleware.js";
import { bookmarkActionDTO, getUserBookmarksDTO } from "./bookmark.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import bookmarkCtrl from "./bookmark.controller.js";

const bookmarkRouter = Router();

// Bookmark a material
bookmarkRouter.post("/:materialId", checkLogin, bodyValidator(bookmarkActionDTO), bookmarkCtrl.addBookmark);

// Remove bookmark from a material
bookmarkRouter.delete("/:materialId", checkLogin, bookmarkCtrl.removeBookmark);

// Get user's bookmarked materials
bookmarkRouter.get("/", checkLogin, queryValidator(getUserBookmarksDTO), bookmarkCtrl.getUserBookmarks);

// Check if material is bookmarked by user
bookmarkRouter.get("/:materialId/status", checkLogin, bookmarkCtrl.getBookmarkStatus);

export default bookmarkRouter;