import Joi from "joi";

const createMaterialDTO = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 2 characters long.',
      'string.max': 'Title cannot exceed 200 characters.',
      'string.empty': 'Title is required.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  materialType: Joi.string()
    .valid('book', 'note', 'paper', 'slide', 'report', 'video', 'thesis', 'project', 'assignment', 'lab')
    .required()
    .messages({
      'any.only': 'Material type must be a valid type.',
      'any.required': 'Material type is required.',
    }),

  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
      'any.required': 'Faculty is required.',
    }),

  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Course must be a valid ID.',
      'any.required': 'Course is required.',
    }),

  academicSystem: Joi.string()
    .valid('semester', 'yearly')
    .required()
    .messages({
      'any.only': 'Academic system must be semester or yearly.',
      'any.required': 'Academic system is required.',
    }),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .when('academicSystem', {
      is: 'semester',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    })
    .messages({
      'number.base': 'Semester must be a number between 1 and 8.',
      'number.min': 'Semester must be at least 1.',
      'number.max': 'Semester cannot exceed 8.',
      'any.required': 'Semester is required for semester system.',
    }),

  academicYear: Joi.number()
    .integer()
    .min(1)
    .max(4)
    .when('academicSystem', {
      is: 'yearly',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    })
    .messages({
      'number.base': 'Academic year must be a number between 1 and 4.',
      'number.min': 'Academic year must be at least 1.',
      'number.max': 'Academic year cannot exceed 4.',
      'any.required': 'Academic year is required for yearly system.',
    }),

  fileUrl: Joi.string()
    .uri()
    .when('youtubeUrl', {
      is: Joi.exist(),
      then: Joi.optional().allow(''),
      otherwise: Joi.required()
    })
    .messages({
      'string.uri': 'File URL must be a valid URL.',
      'any.required': 'File URL is required when YouTube URL is not provided.',
    }),

  youtubeUrl: Joi.string()
    .uri()
    .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)
    .optional()
    .messages({
      'string.uri': 'YouTube URL must be a valid URL.',
      'string.pattern.base': 'Please provide a valid YouTube URL'
    }),

  fileType: Joi.string()
    .valid('pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'zip')
    .required()
    .messages({
      'any.only': 'File type must be a valid type.',
      'any.required': 'File type is required.',
    }),

  fileSize: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'File size must be a number.',
      'number.min': 'File size must be at least 0 byte.',
      'any.required': 'File size is required.',
    }),

  accessType: Joi.string()
    .valid('public', 'private', 'request-based')
    .default('public')
    .optional(),

  accessCode: Joi.string()
    .min(4)
    .max(20)
    .when('accessType', {
      is: 'private',
      then: Joi.required(),
      otherwise: Joi.optional().allow(null)
    })
    .messages({
      'string.min': 'Access code must be at least 4 characters.',
      'string.max': 'Access code cannot exceed 20 characters.',
      'any.required': 'Access code is required for private materials.',
    }),

  author: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Author name cannot exceed 100 characters.',
    })
});

const updateMaterialDTO = Joi.object({
  title: Joi.string()
    .min(2)
    .max(200)
    .optional()
    .messages({
      'string.min': 'Title must be at least 2 characters long.',
      'string.max': 'Title cannot exceed 200 characters.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  materialType: Joi.string()
    .valid('book', 'note', 'paper', 'slide', 'report', 'video', 'thesis', 'project', 'assignment', 'lab')
    .optional()
    .messages({
      'any.only': 'Material type must be a valid type.',
    }),

  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
    }),

  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Course must be a valid ID.',
    }),

  academicSystem: Joi.string()
    .valid('semester', 'yearly')
    .optional()
    .messages({
      'any.only': 'Academic system must be semester or yearly.',
    }),

  semester: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Semester must be a number between 1 and 8.',
      'number.min': 'Semester must be at least 1.',
      'number.max': 'Semester cannot exceed 8.',
    }),

  academicYear: Joi.number()
    .integer()
    .min(1)
    .max(4)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Academic year must be a number between 1 and 4.',
      'number.min': 'Academic year must be at least 1.',
      'number.max': 'Academic year cannot exceed 4.',
    }),

  fileUrl: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'File URL must be a valid URL.',
    }),

  youtubeUrl: Joi.string()
    .uri()
    .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)
    .optional()
    .messages({
      'string.uri': 'YouTube URL must be a valid URL.',
      'string.pattern.base': 'Please provide a valid YouTube URL'
    }),

  fileType: Joi.string()
    .valid('pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'zip')
    .optional()
    .messages({
      'any.only': 'File type must be a valid type.',
    }),

  fileSize: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'File size must be a number.',
      'number.min': 'File size must be at least 0 byte.',
    }),

  accessType: Joi.string()
    .valid('public', 'private', 'request-based')
    .optional(),

  accessCode: Joi.string()
    .min(4)
    .max(20)
    .optional()
    .allow(null)
    .messages({
      'string.min': 'Access code must be at least 4 characters.',
      'string.max': 'Access code cannot exceed 20 characters.',
    }),

  author: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Author name cannot exceed 100 characters.',
    }),

  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .optional()
    .messages({
      'any.only': 'Status must be pending, approved, or rejected.',
    }),

  rejectionReason: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Rejection reason cannot exceed 500 characters.',
    })
});

// DTO for admin verification
const verifyMaterialDTO = Joi.object({
  status: Joi.string()
    .valid('approved', 'rejected')
    .required()
    .messages({
      'any.only': 'Status must be approved or rejected.',
      'any.required': 'Status is required.',
    }),

  rejectionReason: Joi.string()
    .max(500)
    .when('status', {
      is: 'rejected',
      then: Joi.required(),
      otherwise: Joi.optional().allow('')
    })
    .messages({
      'string.max': 'Rejection reason cannot exceed 500 characters.',
      'any.required': 'Rejection reason is required when rejecting material.',
    })
});

// DTO for access code validation
const accessCodeDTO = Joi.object({
  accessCode: Joi.string()
    .min(4)
    .max(20)
    .required()
    .messages({
      'string.min': 'Access code must be at least 4 characters.',
      'string.max': 'Access code cannot exceed 20 characters.',
      'any.required': 'Access code is required.',
    })
});

export { 
  createMaterialDTO, 
  updateMaterialDTO, 
  verifyMaterialDTO, 
  accessCodeDTO 
};