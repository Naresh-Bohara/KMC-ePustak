import Joi from "joi";

// ==================== GET NOTIFICATIONS DTO ====================

const getNotificationsDTO = Joi.object({
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
    .default(20)
    .messages({
      'number.base': 'Limit must be a number.',
      'number.min': 'Limit must be at least 1.',
      'number.max': 'Limit cannot exceed 50.',
    }),

  // Status filter
  status: Joi.string()
    .valid('all', 'unread', 'read')
    .default('all')
    .messages({
      'any.only': 'Status must be: all, unread, or read.',
    }),

  // Type filter
  type: Joi.string()
    .valid(
      'all',
      'material_approved',
      'material_rejected', 
      'new_material',
      'access_request',
      'access_approved',
      'access_rejected',
      'system_alert',
      'announcement'
    )
    .default('all')
    .messages({
      'any.only': 'Notification type must be a valid type.',
    }),

  // Sorting
  sortBy: Joi.string()
    .valid('createdAt', 'type')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be: createdAt or type.',
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be asc or desc.',
    })

}).unknown(false);

// ==================== MARK AS READ DTO ====================

const markAsReadDTO = Joi.object({
  readAll: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Read all must be true or false.',
    })
}).unknown(false);

// ==================== CREATE NOTIFICATION DTO (For internal/admin use) ====================

const createNotificationDTO = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be a valid ID.',
      'any.required': 'User ID is required.',
    }),

  type: Joi.string()
    .valid(
      'material_approved',
      'material_rejected', 
      'new_material',
      'access_request',
      'access_approved',
      'access_rejected',
      'system_alert',
      'announcement'
    )
    .required()
    .messages({
      'any.only': 'Notification type must be a valid type.',
      'any.required': 'Notification type is required.',
    }),

  title: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Title cannot exceed 100 characters.',
      'any.required': 'Title is required.',
    }),

  message: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Message cannot exceed 200 characters.',
      'any.required': 'Message is required.',
    }),

  relatedTo: Joi.object({
    entity: Joi.string()
      .valid('material', 'access_request', 'user')
      .required()
      .messages({
        'any.only': 'Entity must be: material, access_request, or user.',
        'any.required': 'Entity is required.',
      }),
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Entity ID must be a valid ID.',
        'any.required': 'Entity ID is required.',
      })
  }).optional(),

  actionUrl: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Action URL cannot exceed 200 characters.',
    })

}).unknown(false);

export { 
  getNotificationsDTO, 
  markAsReadDTO, 
  createNotificationDTO 
};