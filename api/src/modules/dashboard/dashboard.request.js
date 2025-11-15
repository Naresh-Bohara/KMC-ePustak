import Joi from "joi";

const dashboardQueryDTO = Joi.object({
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

  // Time period filters
  period: Joi.string()
    .valid('today', 'week', 'month', 'year', 'all')
    .default('month')
    .messages({
      'any.only': 'Period must be: today, week, month, year, or all.',
    }),

  // Faculty filter (for admin)
  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
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

  // Sort options for popular materials
  sortBy: Joi.string()
    .valid('viewCount', 'downloadCount', 'createdAt', 'bookmarkCount')
    .default('viewCount')
    .messages({
      'any.only': 'Sort by must be: viewCount, downloadCount, createdAt, or bookmarkCount.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    })

}).unknown(false); // Strict validation - no unknown fields allowed

// Separate DTO for teacher materials with additional filters
const teacherMaterialsDTO = Joi.object({
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
    .max(20)
    .default(5)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 20.',
    }),

  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'all')
    .default('all')
    .messages({
      'any.only': 'Status must be: pending, approved, rejected, or all.',
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'viewCount', 'downloadCount', 'title')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be: createdAt, viewCount, downloadCount, or title.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    })

}).unknown(false);

export { dashboardQueryDTO, teacherMaterialsDTO };