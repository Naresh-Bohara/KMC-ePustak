import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: 10
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    establishedYear: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear()
    },
    hod: {  
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    contactPhone: {  
        type: String,
        trim: true
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
FacultySchema.index({ status: 1 });

const FacultyModel = mongoose.model("Faculty", FacultySchema);
export default FacultyModel;