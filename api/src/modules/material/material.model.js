import mongoose from "mongoose";

const StudyMaterialSchema = new mongoose.Schema({
    // BASIC INFORMATION
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    
    // MATERIAL TYPE
    materialType: {
        type: String,
        enum: [
            'book', 
            'note', 
            'paper', 
            'slide', 
            'report', 
            'video', 
            'thesis',
            'project',
            'assignment',
            'lab'
        ],
        required: true
    },
    
    // ACADEMIC INFORMATION
    faculty: {
        type: mongoose.Types.ObjectId,
        ref: "Faculty",
        required: true
    },
    course: {
        type: mongoose.Types.ObjectId,
        ref: "Course",
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
        max: 8
    },
    academicYear: {
        type: Number,
        min: 1,
        max: 4
    },
    
    // CONTENT DELIVERY (Either fileUrl OR youtubeUrl)
    fileUrl: {
        type: String,
        required: function() {
            return !this.youtubeUrl;
        }
    },
    fileType: {
        type: String,
        enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'zip'],
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    
    // YOUTUBE VIDEO FIELDS
    youtubeUrl: {
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(v);
            },
            message: 'Please provide a valid YouTube URL'
        }
    },
    youtubeVideoId: {
        type: String
    },
    thumbnail: {
        type: String
    },
    
    // ACCESS CONTROL
    accessType: {
        type: String,
        enum: ['public', 'private', 'request-based'],
        default: 'public'
    },
    accessCode: {
        type: String,
        trim: true,
        required: function() {
            return this.accessType === 'private';
        }
    },
    
    // UPLOADER INFO
    uploadedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    author: {
        type: String,
        trim: true
    },
    
    // ADMIN MODERATION
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    verifiedBy: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    verifiedAt: Date,
    rejectionReason: {
        type: String,
        trim: true
    },
    
    // ENGAGEMENT METRICS
    downloadCount: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true,
    autoCreate: true,
    autoIndex: true
});

// INDEXES FOR PERFORMANCE
StudyMaterialSchema.index({ faculty: 1, course: 1 });
StudyMaterialSchema.index({ materialType: 1, status: 1 });
StudyMaterialSchema.index({ uploadedBy: 1, createdAt: -1 });
StudyMaterialSchema.index({ status: 1 });
StudyMaterialSchema.index({ title: 'text', description: 'text' });

const StudyMaterialModel = mongoose.model("StudyMaterial", StudyMaterialSchema);
export default StudyMaterialModel;