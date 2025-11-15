import { Router } from "express";
import { searchQueryDTO } from "./search.request.js";
import { checkLogin } from "../../middlewares/auth.middleware.js";
import searchCtrl from "./search.controller.js";
import { queryValidator } from "../../middlewares/request-validator.middleware.js";

const searchRouter = Router();

// search with multiple filters
searchRouter.get("/materials", checkLogin, queryValidator(searchQueryDTO), searchCtrl.advancedSearch);

// Get available filter options for search
searchRouter.get("/filters/options", checkLogin, searchCtrl.getFilterOptions);

export default searchRouter;