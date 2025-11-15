import mongoose from "mongoose";

const AccessRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    material: {
        type: mongoose.Types.ObjectId,
        ref: "StudyMaterial",
        required: true,
        index: true
    },
    teacher: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    // Student's request message
    requestMessage: {
        type: String,
        trim: true,
        maxlength: 500,
        required: false
    },
    // Teacher's response message
    responseMessage: {
        type: String,
        trim: true,
        maxlength: 500
    },
    // When teacher responded
    respondedAt: {
        type: Date
    },
    // Access expiry (optional - for time-limited access)
    accessExpiresAt: {
        type: Date
    },
    // Automatic cancellation after certain period
    autoCancelAt: {
        type: Date,
        default: function() {
            const date = new Date();
            date.setDate(date.getDate() + 7); // Auto cancel after 7 days
            return date;
        }
    }
}, {
    timestamps: true,
    autoCreate: true,
    autoIndex: true
});

// ==================== INDEXES FOR PERFORMANCE ====================

// Prevent duplicate requests from same student for same material
AccessRequestSchema.index({ student: 1, material: 1 }, { 
    unique: true,
    partialFilterExpression: { status: { $in: ['pending', 'approved'] } }
});

// Fast queries for teacher dashboard
AccessRequestSchema.index({ teacher: 1, status: 1 });
AccessRequestSchema.index({ teacher: 1, createdAt: -1 });

// Fast queries for student requests
AccessRequestSchema.index({ student: 1, status: 1 });
AccessRequestSchema.index({ student: 1, createdAt: -1 });

// Material-based queries
AccessRequestSchema.index({ material: 1, status: 1 });

// For auto-cancellation job
AccessRequestSchema.index({ status: 1, autoCancelAt: 1 });

// For access expiry checks
AccessRequestSchema.index({ status: 'approved', accessExpiresAt: 1 });

// ==================== FIXED MIDDLEWARE & HOOKS ====================

// ✅ FIXED: Auto-populate teacher from material BEFORE validation
AccessRequestSchema.pre('validate', async function(next) {
    if (this.isNew && !this.teacher) {
        try {
            const material = await mongoose.model('StudyMaterial')
                .findById(this.material)
                .select('uploadedBy');
            
            if (material && material.uploadedBy) {
                this.teacher = material.uploadedBy;
            } else {
                // If material not found, we can't proceed - this will trigger validation error
                return next(new Error('Material not found or has no uploader'));
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Update respondedAt when status changes from pending
AccessRequestSchema.pre('save', function(next) {
    if (this.isModified('status') && 
        this.status !== 'pending' && 
        !this.respondedAt) {
        this.respondedAt = new Date();
    }
    next();
});

// ==================== VIRTUAL FIELDS ====================

// Check if request is expired (for auto-cancellation)
AccessRequestSchema.virtual('isExpired').get(function() {
    return this.status === 'pending' && new Date() > this.autoCancelAt;
});

// Check if access is still valid (if expiry is set)
AccessRequestSchema.virtual('isAccessValid').get(function() {
    if (this.status !== 'approved') return false;
    if (!this.accessExpiresAt) return true;
    return new Date() < this.accessExpiresAt;
});

// ==================== INSTANCE METHODS ====================

// Method to approve request
AccessRequestSchema.methods.approve = function(responseMessage = '', expiresInDays = null) {
    this.status = 'approved';
    this.responseMessage = responseMessage;
    this.respondedAt = new Date();
    
    if (expiresInDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + expiresInDays);
        this.accessExpiresAt = expiry;
    }
};

// Method to reject request
AccessRequestSchema.methods.reject = function(responseMessage = '') {
    this.status = 'rejected';
    this.responseMessage = responseMessage;
    this.respondedAt = new Date();
};

// Method to cancel request (by student)
AccessRequestSchema.methods.cancel = function() {
    if (this.status === 'pending') {
        this.status = 'cancelled';
        this.respondedAt = new Date();
    }
};

// ==================== STATIC METHODS ====================

// Find pending requests that need auto-cancellation
AccessRequestSchema.statics.findExpiredPendingRequests = function() {
    return this.find({
        status: 'pending',
        autoCancelAt: { $lte: new Date() }
    });
};

// Find approved requests that have expired access
AccessRequestSchema.statics.findExpiredAccess = function() {
    return this.find({
        status: 'approved',
        accessExpiresAt: { $lte: new Date() }
    });
};

// Check if student has access to material
AccessRequestSchema.statics.hasAccess = function(studentId, materialId) {
    return this.findOne({
        student: studentId,
        material: materialId,
        status: 'approved',
        $or: [
            { accessExpiresAt: null },
            { accessExpiresAt: { $gt: new Date() } }
        ]
    });
};

const AccessRequestModel = mongoose.model("AccessRequest", AccessRequestSchema);
export default AccessRequestModel;