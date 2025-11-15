import Joi from "joi";

// REQUEST ACCESS DTO 
const requestAccessDTO = Joi.object({
  requestMessage: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Request message cannot exceed 500 characters.',
    })
});

// RESPOND TO REQUEST DTO 
const respondRequestDTO = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Action must be either "approve" or "reject".',
      'any.required': 'Action is required.',
    }),

  responseMessage: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Response message cannot exceed 500 characters.',
    }),

  expiresInDays: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .optional()
    .messages({
      'number.base': 'Expires in days must be a number.',
      'number.min': 'Expires in days must be at least 1.',
      'number.max': 'Expires in days cannot exceed 365.',
    })
});

//  STUDENT REQUESTS DTO 
const studentRequestsDTO = Joi.object({
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
    .max(50)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 50.',
    }),

  // Status filter
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'cancelled', 'all')
    .default('all')
    .messages({
      'any.only': 'Status must be: pending, approved, rejected, cancelled, or all.',
    }),

  // Sorting
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be: createdAt, updatedAt, or status.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    }),

  // Material type filter
  materialType: Joi.string()
    .valid(
      'book', 'note', 'paper', 'slide', 'report', 
      'video', 'thesis', 'project', 'assignment', 'lab'
    )
    .optional()
    .messages({
      'any.only': 'Material type must be a valid type.',
    }),

  // Faculty filter
  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
    })

}).unknown(false); // Strict validation - no unknown fields

//  TEACHER REQUESTS DTO 
const teacherRequestsDTO = Joi.object({
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
    .max(30)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 30.',
    }),

  // Status filter
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'cancelled', 'all')
    .default('pending')
    .messages({
      'any.only': 'Status must be: pending, approved, rejected, cancelled, or all.',
    }),

  // Sorting
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'student.name', 'material.title')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be: createdAt, updatedAt, student.name, or material.title.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    }),

  // Student name search
  search: Joi.string()
    .max(100)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search query cannot exceed 100 characters.',
    }),

  // Material type filter
  materialType: Joi.string()
    .valid(
      'book', 'note', 'paper', 'slide', 'report', 
      'video', 'thesis', 'project', 'assignment', 'lab'
    )
    .optional()
    .messages({
      'any.only': 'Material type must be a valid type.',
    }),

  // Time period filter
  period: Joi.string()
    .valid('today', 'week', 'month', 'all')
    .default('all')
    .messages({
      'any.only': 'Period must be: today, week, month, or all.',
    })

}).unknown(false); 

// ACCESS STATUS DTO
const accessStatusDTO = Joi.object({
  includeRequestDetails: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Include request details must be true or false.',
    })
}).unknown(false);

export { 
  requestAccessDTO, 
  respondRequestDTO, 
  studentRequestsDTO, 
  teacherRequestsDTO,
  accessStatusDTO 
};