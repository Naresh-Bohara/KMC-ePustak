//to validate request 

import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";

const bodyValidator = (schemaDto) => {
    return async (req, res, next) => {
        try {
            let data = req.body;
            //validate your data
            const validatedData = await schemaDto.validateAsync(data, { abortEarly: false });
            
            // Replace body with validated data
            req.body = validatedData;
            next();
            
        } catch (exception) {
            let msg = {};
            
            //exception.details
            exception.details.map((error) => {
                msg[error.context.label] = error.message;
            });
            
            next({
                detail: msg, 
                statusCode: HttpResponse.validationFailed, 
                message: "Validation Failed", 
                status: HttpResponseCode.BAD_REQUEST
            });
        }
    }
}

const queryValidator = (schemaDto) => {
    return async (req, res, next) => {
        try {
            let data = { ...req.query };
            
            // Convert string numbers to actual numbers for query params
            if (data.page) data.page = parseInt(data.page);
            if (data.limit) data.limit = parseInt(data.limit);
            if (data.semester) data.semester = parseInt(data.semester);
            if (data.academicYear) data.academicYear = parseInt(data.academicYear);
            if (data.creditHours) data.creditHours = parseInt(data.creditHours);
            
            // Validate query parameters
            const validatedData = await schemaDto.validateAsync(data, { abortEarly: false });
            
            // ✅ FIX: Don't replace req.query, just pass validated data to next middleware
            req.validatedQuery = validatedData; // Add to request object
            next();
            
        } catch (exception) {
            let msg = {};
            
            // Handle both Joi and other errors
            if (exception.isJoi) {
                exception.details.forEach((error) => {
                    msg[error.path[0]] = error.message;
                });
            } else {
                msg.general = exception.message;
            }
            
            next({
                detail: msg, 
                statusCode: HttpResponse.validationFailed, 
                message: "Query validation failed", 
                status: HttpResponseCode.BAD_REQUEST
            });
        }
    }
}

export { bodyValidator, queryValidator };