import Joi from "joi";

const bookmarkActionDTO = Joi.object({
  action: Joi.string()
    .valid('bookmark')
    .required()
    .messages({
      'any.only': 'Action must be "bookmark".',
      'any.required': 'Action is required.',
    })
});

const getUserBookmarksDTO = Joi.object({
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

  // Sorting
  sortBy: Joi.string()
    .valid('createdAt', 'materialType', 'title')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, materialType, title.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    }),

  // Filters
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
    })

}).unknown(false); 

export { bookmarkActionDTO, getUserBookmarksDTO };