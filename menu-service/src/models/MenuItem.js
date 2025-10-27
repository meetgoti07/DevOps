const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    image_url: {
        type: String,
        default: ''
    },
    preparation_time: {
        type: Number,
        required: true,
        min: 1,
        default: 10 // minutes
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

// Index for better query performance
menuItemSchema.index({ category: 1, available: 1 });
menuItemSchema.index({ name: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema, 'menu_items');