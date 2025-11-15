import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'teacher'],
        required: true,
        default: 'student'
    },
    
    studentProfile: {
        type: {
            faculty: {
                type: mongoose.Types.ObjectId,
                ref: "Faculty"
            },
            academicSystem: {
                type: String,
                enum: ['semester', 'yearly'],
                required: function() { return this.role === 'student'; }
            },
            semester: {
                type: Number,
                min: 1,
                max: 8,
                required: function() { 
                    return this.role === 'student' && this.studentProfile?.academicSystem === 'semester'; 
                }
            },
            academicYear: {
                type: Number,
                min: 1,
                max: 4,
                required: function() { 
                    return this.role === 'student' && this.studentProfile?.academicSystem === 'yearly'; 
                }
            },
            enrollmentYear: {
                type: Number,
                min: 2000,
                max: new Date().getFullYear()
            },
            rollNumber: {
                type: String,
                trim: true
            }
        },
        default: undefined 
    },
    
    teacherProfile: {
        type: {
            faculties: [{
                type: mongoose.Types.ObjectId,
                ref: "Faculty"
            }],
            courses: [{
                type: mongoose.Types.ObjectId,
                ref: "Course"
            }],
            isVerified: {
                type: Boolean,
                default: false
            },
            employeeId: {
                type: String,
                trim: true
            },
            designation: {
                type: String,
                enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer'],
                default: 'Lecturer'
            },
            specialization: {
                type: String,
                trim: true
            }
        },
        default: undefined 
    },
    
    phone: {
        type: String,
        trim: true
    },
    profileImage: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: "pending"
    },
    
    // AUTHENTICATION FIELDS
    activationToken: String,
    forgetToken: String,
    expiryTime: Date,
    
    // ACTIVITY TRACKING
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },

    // ADD THIS NEW FIELD FOR PRIVATE MATERIAL ACCESS
    accessedMaterials: [{
        materialId: {
            type: mongoose.Types.ObjectId,
            ref: "StudyMaterial",
            required: true
        },
        accessedAt: {
            type: Date,
            default: Date.now
        },
        accessCode: {
            type: String,
            required: true
        }
    }]

}, {
    timestamps: true,
    autoCreate: true,
    autoIndex: true
});

// Index for better query performance

UserSchema.index({ role: 1 });
UserSchema.index({ 'studentProfile.faculty': 1 });
UserSchema.index({ 'teacherProfile.isVerified': 1 });
UserSchema.index({ 'accessedMaterials.materialId': 1 }); 

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;