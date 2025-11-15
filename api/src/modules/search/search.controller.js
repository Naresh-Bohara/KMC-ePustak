
import HttpResponse from "../../constants/response-status.contants.js";
import searchSvc from "./search.service.js";

class SearchController {
    
    advancedSearch = async (req, res, next) => {
        try {
            const result = await searchSvc.searchMaterials(req.query, req.loggedInUser._id, req.loggedInUser.role);
            
            res.json({
                data: result.materials,
                pagination: result.pagination,
                filters: result.filters,
                message: result.materials.length > 0 
                    ? "Materials found successfully" 
                    : "No materials found matching your criteria",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };

    getFilterOptions = async (req, res, next) => {
        try {
            const filterOptions = await searchSvc.getSearchFilters();
            
            res.json({
                data: filterOptions,
                message: "Filter options retrieved successfully",
                status: HttpResponse.success,
                options: null
            });
            
        } catch (exception) {
            next(exception);
        }
    };
}

const searchCtrl = new SearchController();
export default searchCtrl;