import Joi from "joi";

const searchQueryDTO = Joi.object({
  // Pagination
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number.',
      'number.min': 'Page must be at least 1.',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 100.',
    }),

  // Sorting
  sortBy: Joi.string()
    .valid('createdAt', 'title', 'viewCount', 'downloadCount', 'updatedAt')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, title, viewCount, downloadCount, updatedAt.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    }),

  // Search query
  search: Joi.string()
    .max(100)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search query cannot exceed 100 characters.',
    }),

  // Material filters
  materialType: Joi.string()
    .valid(
      'book', 'note', 'paper', 'slide', 'report', 
      'video', 'thesis', 'project', 'assignment', 'lab'
    )
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
    .messages({
      'number.base': 'Academic year must be a number between 1 and 4.',
      'number.min': 'Academic year must be at least 1.',
      'number.max': 'Academic year cannot exceed 4.',
    }),

  accessType: Joi.string()
    .valid('public', 'private', 'request-based')
    .optional()
    .messages({
      'any.only': 'Access type must be public, private, or request-based.',
    }),

  uploadedBy: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Uploaded by must be a valid user ID.',
    }),

  // Status (only for admin)
  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .optional()
    .messages({
      'any.only': 'Status must be pending, approved, or rejected.',
    })

}).unknown(true); 

export { searchQueryDTO };