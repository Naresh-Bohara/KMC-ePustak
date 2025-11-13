import Joi from "joi";

// Registration DTO schema 
const userRegistrationDTO = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long.',
      'string.max': 'Name cannot exceed 50 characters.',
      'string.empty': 'Name is required.',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid college email address.',
      'string.empty': 'Email is required.',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long.',
      'string.empty': 'Password is required.',
    }),

  role: Joi.string()
    .valid('student', 'teacher')
    .required()
    .messages({
      'any.only': 'Role must be student, or teacher',
      'any.required': 'Role is required.',
    }),

  phone: Joi.string()
    .pattern(/^(\+977-?)?(98|97)\d{8}$/, 'Phone Number')
    .optional()
    .messages({
      'string.pattern.base': 'Phone number must be a valid Nepali number.',
    }),

  // 👇 STUDENT-SPECIFIC FIELDS
  studentProfile: Joi.object({
    faculty: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/) 
      .required()
      .messages({
        'string.pattern.base': 'Faculty must be a valid ID.',
        'string.empty': 'Faculty is required for students.',
      }),

    academicSystem: Joi.string()
      .valid('semester', 'yearly')
      .required()
      .messages({
        'any.only': 'Academic system must be semester or yearly.',
        'any.required': 'Academic system is required for students.',
      }),

    semester: Joi.number()
      .min(1)
      .max(8)
      .when('academicSystem', {
        is: 'semester',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'number.base': 'Semester must be a number between 1 and 8.',
        'number.min': 'Semester must be at least 1.',
        'number.max': 'Semester cannot exceed 8.',
        'any.required': 'Semester is required for semester system.',
      }),

    academicYear: Joi.number()
      .min(1)
      .max(4)
      .when('academicSystem', {
        is: 'yearly',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'number.base': 'Academic year must be a number between 1 and 4.',
        'number.min': 'Academic year must be at least 1.',
        'number.max': 'Academic year cannot exceed 4.',
        'any.required': 'Academic year is required for yearly system.',
      }),

    enrollmentYear: Joi.number()
      .min(2000)
      .max(new Date().getFullYear()) 
      .required()
      .messages({
        'number.base': 'Enrollment year must be a valid year.',
        'number.min': 'Enrollment year must be 2000 or later.',
        'number.max': 'Enrollment year cannot be in the future.',
        'any.required': 'Enrollment year is required.',
      }),

    rollNumber: Joi.string()
      .trim()
      .optional()
      .messages({
        'string.empty': 'Roll number cannot be empty.',
      }),

  }).when('role', {
    is: 'student',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

  // 👇 TEACHER-SPECIFIC FIELDS
  teacherProfile: Joi.object({
    faculties: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)) 
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one faculty is required for teachers.',
        'any.required': 'Faculties are required for teachers.',
        'string.pattern.base': 'Each faculty must be a valid ID.',
      }),

    courses: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)) 
      .optional()
      .messages({
        'string.pattern.base': 'Each course must be a valid ID.',
      }),

    employeeId: Joi.string()
      .trim()
      .optional()
      .messages({
        'string.empty': 'Employee ID cannot be empty.',
      }),

    designation: Joi.string()
      .valid('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer')
      .default('Lecturer')
      .optional(),

    specialization: Joi.string()
      .trim()
      .optional()
      .messages({
        'string.empty': 'Specialization cannot be empty.',
      }),

  }).when('role', {
    is: 'teacher',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),

});

// Login DTO schema
const loginDTO = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address.',
      'string.empty': 'Email is required.',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required.',
    }),
});

const activationDTO = Joi.object({
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be exactly 6 characters.',
    'any.required': 'OTP is required.'
  }),
  email: Joi.string().email().required()
});

const resendOtpDTO = Joi.object({
  email: Joi.string().email().required()
});

export { userRegistrationDTO, loginDTO, activationDTO, resendOtpDTO };