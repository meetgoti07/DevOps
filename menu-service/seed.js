// Insert categories according to schema
db.categories.insertMany([
    {
        name: "Main Course",
        display_order: 1,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Beverages",
        display_order: 2,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Snacks",
        display_order: 3,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Desserts",
        display_order: 4,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
]);

// Insert menu items according to schema (collection name: menu_items)
db.menu_items.insertMany([
    {
        name: "Chicken Burger",
        description: "Grilled chicken with lettuce and mayo",
        category: "Main Course",
        price: 150,
        available: true,
        image_url: "/images/chicken-burger.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Sandwich",
        description: "Fresh vegetables with cheese",
        category: "Main Course",
        price: 80,
        available: true,
        image_url: "/images/veg-sandwich.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Coffee",
        description: "Hot brewed coffee",
        category: "Beverages",
        price: 50,
        available: true,
        image_url: "/images/coffee.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Cold Drink",
        description: "Chilled soft drink",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/cold-drink.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "French Fries",
        description: "Crispy fried potatoes",
        category: "Snacks",
        price: 60,
        available: true,
        image_url: "/images/fries.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pasta",
        description: "Italian style pasta with tomato sauce",
        category: "Main Course",
        price: 120,
        available: true,
        image_url: "/images/pasta.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Tea",
        description: "Hot masala tea",
        category: "Beverages",
        price: 30,
        available: true,
        image_url: "/images/tea.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Ice Cream",
        description: "Vanilla ice cream scoop",
        category: "Desserts",
        price: 70,
        available: true,
        image_url: "/images/ice-cream.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    }
]);