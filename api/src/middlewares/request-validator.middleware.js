//to validate request 

import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";

const bodyValidator = (schemaDto)=>{
    return async(req, res, next)=>{
        try{
            let data = req.body
            //validate your data
            const validatedData = await schemaDto.validateAsync(data, { abortEarly: false });
            next()
            //handel validation error
        }catch(exception){
            
            //let msg = {}
            let msg = {}
            
            //exception.details
            exception.details.map((error)=>{
                msg[error.context.label] = error.message
            })
            next({detail:msg, statusCode:HttpResponse.validationFailed, message:"Validation Failed", status:HttpResponseCode.BAD_REQUEST})
        }
    }
}

export {bodyValidator};