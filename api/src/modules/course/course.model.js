import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: 20
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    creditHours: {
        type: Number,
        required: true,
        min: 1,
        max: 6
    },
    faculty: {
        type: mongoose.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    academicSystem: {
        type: String,
        enum: ['semester', 'yearly'],
        required: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        required: function() {
            return this.academicSystem === 'semester';
        }
    },
    academicYear: {
        type: Number,
        min: 1,
        max: 4,
        required: function() {
            return this.academicSystem === 'yearly';
        }
    },
    courseType: {
        type: String,
        enum: ['core', 'elective', 'practical'],
        default: 'core'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true,
    autoCreate: true,
    autoIndex: true
});

// Index for better performance
CourseSchema.index({ faculty: 1 });
CourseSchema.index({ semester: 1 });
CourseSchema.index({ academicYear: 1 });
CourseSchema.index({ status: 1 });
CourseSchema.index({ faculty: 1, semester: 1 });
CourseSchema.index({ faculty: 1, academicYear: 1 });

const CourseModel = mongoose.model("Course", CourseSchema);
export default CourseModel;