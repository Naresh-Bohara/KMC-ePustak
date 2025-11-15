import HttpResponse from "../../constants/response-status.contants.js";
import bookmarkSvc from "./bookmark.service.js";

class BookmarkController {
    
    addBookmark = async (req, res, next) => {
        try {
            const result = await bookmarkSvc.addBookmark(
                req.params.materialId, 
                req.loggedInUser._id
            );
            
            res.status(201).json({
                data: result.bookmark,
                message: result.message,
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    removeBookmark = async (req, res, next) => {
        try {
            const result = await bookmarkSvc.removeBookmark(
                req.params.materialId, 
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

    getUserBookmarks = async (req, res, next) => {
        try {
            const result = await bookmarkSvc.getUserBookmarks(
                req.loggedInUser._id, 
                req.query
            );
            
            res.json({
                data: result.bookmarks,
                pagination: result.pagination,
                message: result.bookmarks.length > 0 
                    ? "Bookmarks retrieved successfully" 
                    : "No bookmarks found",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getBookmarkStatus = async (req, res, next) => {
        try {
            const result = await bookmarkSvc.getBookmarkStatus(
                req.params.materialId, 
                req.loggedInUser._id
            );
            
            res.json({
                data: result,
                message: result.isBookmarked 
                    ? "Material is bookmarked" 
                    : "Material is not bookmarked",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const bookmarkCtrl = new BookmarkController();
export default bookmarkCtrl;