import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    // RECIPIENT
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    
    // CONTENT
    type: {
        type: String,
        required: true,
        enum: [
            // MATERIAL
            'material_approved',
            'material_rejected', 
            'new_material',
            
            // ACCESS REQUESTS
            'access_request',
            'access_approved',
            'access_rejected',
            
            // SYSTEM
            'system_alert',
            'announcement'
        ],
        index: true
    },
    
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    
    message: {
        type: String,
        required: true,
        maxlength: 200
    },
    
    // RELATED ENTITY
    relatedTo: {
        type: {
            entity: {
                type: String,
                enum: ['material', 'access_request', 'user']
            },
            id: {
                type: mongoose.Types.ObjectId
            }
        }
    },
    
    // STATUS
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread',
        index: true
    },
    
    // ACTION
    actionUrl: {
        type: String,
        maxlength: 200
    }

}, {
    timestamps: true
});

// ==================== INDEXES ====================

// Main query: user notifications by status and date
NotificationSchema.index({ user: 1, status: 1, createdAt: -1 });

// For cleanup
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days TTL

// ==================== METHODS ====================

NotificationSchema.methods.markAsRead = function() {
    this.status = 'read';
    return this.save();
};

// ==================== STATICS ====================

NotificationSchema.statics.getUnreadCount = function(userId) {
    return this.countDocuments({ user: userId, status: 'unread' });
};

NotificationSchema.statics.markAllAsRead = function(userId) {
    return this.updateMany(
        { user: userId, status: 'unread' },
        { status: 'read' }
    );
};

const NotificationModel = mongoose.model("Notification", NotificationSchema);
export default NotificationModel;