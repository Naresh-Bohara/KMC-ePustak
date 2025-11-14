import Joi from "joi";

const createFacultyDTO = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Faculty name must be at least 2 characters long.',
      'string.max': 'Faculty name cannot exceed 100 characters.',
      'string.empty': 'Faculty name is required.',
    }),

  code: Joi.string()
    .min(2)
    .max(10)
    .required()
    .messages({
      'string.min': 'Faculty code must be at least 2 characters long.',
      'string.max': 'Faculty code cannot exceed 10 characters.',
      'string.empty': 'Faculty code is required.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .messages({
      'number.base': 'Established year must be a valid year.',
      'number.min': 'Established year must be 1900 or later.',
      'number.max': 'Established year cannot be in the future.',
    }),

  hod: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'HOD name cannot exceed 50 characters.',
    }),

  contactEmail: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Please provide a valid email address.',
    }),

  contactPhone: Joi.string()
    .pattern(/^(\+977-?)?(98|97)\d{8}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Phone number must be a valid Nepali number.',
    }),

  status: Joi.string()
    .valid('active', 'inactive')
    .default('active')
    .optional()
});

const updateFacultyDTO = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Faculty name must be at least 2 characters long.',
      'string.max': 'Faculty name cannot exceed 100 characters.',
    }),

  code: Joi.string()
    .min(2)
    .max(10)
    .optional()
    .messages({
      'string.min': 'Faculty code must be at least 2 characters long.',
      'string.max': 'Faculty code cannot exceed 10 characters.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  establishedYear: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .messages({
      'number.base': 'Established year must be a valid year.',
      'number.min': 'Established year must be 1900 or later.',
      'number.max': 'Established year cannot be in the future.',
    }),

  hod: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'HOD name cannot exceed 50 characters.',
    }),

  contactEmail: Joi.string()
    .email()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Please provide a valid email address.',
    }),

  contactPhone: Joi.string()
    .pattern(/^(\+977-?)?(98|97)\d{8}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Phone number must be a valid Nepali number.',
    }),

  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
});

export { createFacultyDTO, updateFacultyDTO };