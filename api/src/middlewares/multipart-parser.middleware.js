import multer from "multer";
import HttpResponseCode from "../constants/http-status-code.contants.js";
import HttpResponse from "../constants/response-status.contants.js";

// Set up memory storage
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, "./public")
    }, 
    filename: (req, file, cb)=>{
        cb(null, file.originalname)
    }
});

const uploadFile = (filetype = "image")=>{
    const typeFilter = (req, file, cb) =>{
        const ext = file.originalname.split(".").pop().toLowerCase();

        if(filetype === "image" && ['jpg', 'jpeg', 'png', 'svg', 'bmp', 'webp'].includes(ext)){
          cb(null, true)
        }else if(filetype === "doc"  && ['txt', 'pdf', 'csv', 'xslx', 'json', 'xls', 'ppt'].includes(ext)){
          cb(null, true)
        }else{
          // insupported file
          cb({status: HttpResponseCode.BAD_REQUEST, message: "File format not supported", code: HttpResponse.validationFailed})
        }
      }
    return multer({
        storage: storage,
        fileFilter: typeFilter,
        limits:{
            fileSize: 5* 1024* 1024
        }
      });
}

export { uploadFile };
