import Joi from "joi";

const createCourseDTO = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Course name must be at least 2 characters long.',
      'string.max': 'Course name cannot exceed 100 characters.',
      'string.empty': 'Course name is required.',
    }),

  code: Joi.string()
    .min(2)
    .max(20)
    .required()
    .messages({
      'string.min': 'Course code must be at least 2 characters long.',
      'string.max': 'Course code cannot exceed 20 characters.',
      'string.empty': 'Course code is required.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  creditHours: Joi.number()
    .integer()
    .min(1)
    .max(6)
    .required()
    .messages({
      'number.base': 'Credit hours must be a number.',
      'number.min': 'Credit hours must be at least 1.',
      'number.max': 'Credit hours cannot exceed 6.',
      'any.required': 'Credit hours are required.',
    }),

  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
      'any.required': 'Faculty is required.',
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

  courseType: Joi.string()
    .valid('core', 'elective', 'practical')
    .default('core')
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive')
    .default('active')
    .optional()
});

const updateCourseDTO = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Course name must be at least 2 characters long.',
      'string.max': 'Course name cannot exceed 100 characters.',
    }),

  code: Joi.string()
    .min(2)
    .max(20)
    .optional()
    .messages({
      'string.min': 'Course code must be at least 2 characters long.',
      'string.max': 'Course code cannot exceed 20 characters.',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters.',
    }),

  creditHours: Joi.number()
    .integer()
    .min(1)
    .max(6)
    .optional()
    .messages({
      'number.base': 'Credit hours must be a number.',
      'number.min': 'Credit hours must be at least 1.',
      'number.max': 'Credit hours cannot exceed 6.',
    }),

  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Faculty must be a valid ID.',
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

  courseType: Joi.string()
    .valid('core', 'elective', 'practical')
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive')
    .optional()
});

export { createCourseDTO, updateCourseDTO };