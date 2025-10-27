const express = require('express');
const router = express.Router();
const { authMiddleware, adminRequired } = require('../middleware/auth');
const {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllCategories,
    createCategory
} = require('../controllers/menuController');

// Public routes
router.get('/items', getAllMenuItems);
router.get('/items/:id', getMenuItemById);
router.get('/categories', getAllCategories);

// Admin only routes
router.post('/items', authMiddleware, adminRequired, createMenuItem);
router.put('/items/:id', authMiddleware, adminRequired, updateMenuItem);
router.delete('/items/:id', authMiddleware, adminRequired, deleteMenuItem);
router.post('/categories', authMiddleware, adminRequired, createCategory);

module.exports = router;