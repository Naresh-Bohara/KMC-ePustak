// bookmark.model.js
import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema({
    user: {
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
    // Additional useful fields
    materialType: {
        type: String,
        enum: [
            'book', 'note', 'paper', 'slide', 'report', 
            'video', 'thesis', 'project', 'assignment', 'lab'
        ]
    },
    faculty: {
        type: mongoose.Types.ObjectId,
        ref: "Faculty"
    },
    course: {
        type: mongoose.Types.ObjectId,
        ref: "Course"
    }
}, {
    timestamps: true,
    autoCreate: true,
    autoIndex: true
});

// Compound index to prevent duplicates - MOST IMPORTANT
BookmarkSchema.index({ user: 1, material: 1 }, { unique: true });

// Additional indexes for better performance
BookmarkSchema.index({ user: 1, createdAt: -1 }); // User's recent bookmarks
BookmarkSchema.index({ user: 1, materialType: 1 }); // Filter by type
BookmarkSchema.index({ user: 1, faculty: 1 }); // Filter by faculty

// Pre-save hook to populate additional fields
BookmarkSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            // Populate material details to store denormalized data
            const material = await mongoose.model('StudyMaterial').findById(this.material)
                .select('materialType faculty course')
                .populate('faculty course');
            
            if (material) {
                this.materialType = material.materialType;
                this.faculty = material.faculty;
                this.course = material.course;
            }
        } catch (error) {
            // Continue even if population fails
            console.error('Error populating bookmark fields:', error);
        }
    }
    next();
});

const BookmarkModel = mongoose.model("Bookmark", BookmarkSchema);
export default BookmarkModel;