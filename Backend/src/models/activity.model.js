const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    id: {
        type: String,
        trim: true
    },

    title: {
        type: String,
        trim: true
    },

    name: {
        type: String,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true,
        enum: ['walk', 'camp', 'course', 'volunteer', 'trail', 'monitoring', 'conservation-project']
    },

    category: {
        type: String,
        default: 'Nature Activities'
    },

    tags: {
        type: [String],
        default: []
    },

    interests: {
        type: [String],
        default: []
    },

    date: {
        type: Date,
        default: Date.now
    },

    location: {
        type: String,
        required: true
    },

    capacity: {
        type: Number,
        default: 30
    },

    registeredCount: {
        type: Number,
        default: 0
    },

    leader: {
        type: String,
        default: null
    },

    createdBy: {
        type: mongoose.Schema.Types.Mixed,
        default: 'admin'
    },

    status: {
        type: String,
        enum: ['draft', 'upcoming', 'open', 'ongoing', 'full', 'completed', 'cancelled'],
        default: 'upcoming'
    },

    difficulty: {
        type: String,
        default: 'moderate'
    },

    duration: {
        type: String,
        default: '2-3 hours'
    },

    image: {
        url: { type: String, trim: true },
        mediumUrl: { type: String, trim: true },
        smallUrl: { type: String, trim: true },
        source: { type: String, default: 'pexels' },
        photographer: { type: String, trim: true },
        attributionUrl: { type: String, trim: true },
        alt: { type: String, trim: true }
    },

    imageUrl: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Hook to ensure name and title remain synchronized
ActivitySchema.pre('save', function() {
    if (this.title && !this.name) this.name = this.title;
    if (this.name && !this.title) this.title = this.name;
    if (!this.id) {
        this.id = 'bnhs_' + (this.name || this.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40) + '_' + Date.now().toString(36);
    }
    if (this.tags && this.tags.length && (!this.interests || !this.interests.length)) {
        this.interests = this.tags;
    }
    if (this.interests && this.interests.length && (!this.tags || !this.tags.length)) {
        this.tags = this.interests;
    }
});

const ActivityModel = mongoose.model('Activity', ActivitySchema);

module.exports = ActivityModel;