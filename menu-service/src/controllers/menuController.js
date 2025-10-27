const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');

// Get all menu items
const getAllMenuItems = async (req, res) => {
    try {
        const { category, available } = req.query;
        let filter = {};

        if (category) {
            filter.category = category;
        }

        if (available !== undefined) {
            filter.available = available === 'true';
        }

        const menuItems = await MenuItem.find(filter).sort({ category: 1, name: 1 });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items', error: error.message });
    }
};

// Get single menu item
const getMenuItemById = async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item', error: error.message });
    }
};

// Create new menu item (admin only)
const createMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, available, image_url, preparation_time } = req.body;

        const menuItem = new MenuItem({
            name,
            description,
            category,
            price,
            available,
            image_url,
            preparation_time
        });

        const savedMenuItem = await menuItem.save();
        res.status(201).json(savedMenuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error creating menu item', error: error.message });
    }
};

// Update menu item (admin only)
const updateMenuItem = async (req, res) => {
    try {
        const { name, description, category, price, available, image_url, preparation_time } = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            { name, description, category, price, available, image_url, preparation_time },
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating menu item', error: error.message });
    }
};

// Delete menu item (admin only)
const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item', error: error.message });
    }
};

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ active: true }).sort({ display_order: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// Create new category (admin only)
const createCategory = async (req, res) => {
    try {
        const { name, display_order, active } = req.body;

        const category = new Category({
            name,
            display_order,
            active
        });

        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(400).json({ message: 'Error creating category', error: error.message });
    }
};

module.exports = {
    getAllMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getAllCategories,
    createCategory
};