import Joi from "joi";

const deleteUserDTO = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be a valid ID.',
      'any.required': 'User ID is required.',
    }),
  
  reason: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Reason cannot exceed 200 characters.',
    })

}).unknown(false);

const changeUserStatusDTO = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be a valid ID.',
      'any.required': 'User ID is required.',
    }),
  
  status: Joi.string()
    .valid('active', 'inactive', 'pending')
    .required()
    .messages({
      'any.only': 'Status must be: active, inactive, or pending.',
      'any.required': 'Status is required.',
    }),
  
  reason: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Reason cannot exceed 200 characters.',
    })

}).unknown(false);

export { 
  deleteUserDTO, 
  changeUserStatusDTO 
};