// Clear existing data to prevent duplicates
db.categories.deleteMany({});
db.menu_items.deleteMany({});
db.menuitems.deleteMany({});

print("Cleared existing menu data");

// Insert categories
const categories = [
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
    },
    {
        name: "South Indian",
        display_order: 5,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
];

const categoryResult = db.categories.insertMany(categories);
print(`Inserted ${categoryResult.insertedIds.length} categories`);

// Insert menu items
const menuItems = [
    // Main Course
    {
        name: "Chicken Burger",
        description: "Grilled chicken breast with lettuce, tomato, and mayo in a fresh bun",
        category: "Main Course",
        price: 180,
        available: true,
        image_url: "/images/chicken-burger.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Burger",
        description: "Crispy veg patty with fresh vegetables and special sauce",
        category: "Main Course",
        price: 140,
        available: true,
        image_url: "/images/veg-burger.jpg",
        preparation_time: 12,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Sandwich",
        description: "Grilled chicken with fresh vegetables and cheese",
        category: "Main Course",
        price: 120,
        available: true,
        image_url: "/images/chicken-sandwich.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Sandwich",
        description: "Fresh vegetables with cheese and mayo",
        category: "Main Course",
        price: 80,
        available: true,
        image_url: "/images/veg-sandwich.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pasta Alfredo",
        description: "Creamy white sauce pasta with herbs",
        category: "Main Course",
        price: 160,
        available: true,
        image_url: "/images/pasta-alfredo.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pasta Arrabbiata",
        description: "Spicy tomato sauce pasta with garlic and herbs",
        category: "Main Course",
        price: 150,
        available: true,
        image_url: "/images/pasta-arrabbiata.jpg",
        preparation_time: 16,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Fried Rice",
        description: "Stir-fried rice with chicken and vegetables",
        category: "Main Course",
        price: 170,
        available: true,
        image_url: "/images/chicken-fried-rice.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Fried Rice",
        description: "Stir-fried rice with mixed vegetables",
        category: "Main Course",
        price: 130,
        available: true,
        image_url: "/images/veg-fried-rice.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },

    // South Indian
    {
        name: "Masala Dosa",
        description: "Crispy dosa with spiced potato filling, served with sambar and chutney",
        category: "South Indian",
        price: 90,
        available: true,
        image_url: "/images/masala-dosa.jpg",
        preparation_time: 12,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Plain Dosa",
        description: "Crispy thin dosa served with sambar and coconut chutney",
        category: "South Indian",
        price: 70,
        available: true,
        image_url: "/images/plain-dosa.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Idli Sambar",
        description: "Steamed rice cakes served with sambar and chutney (4 pieces)",
        category: "South Indian",
        price: 60,
        available: true,
        image_url: "/images/idli-sambar.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Vada Sambar",
        description: "Crispy lentil donuts served with sambar and chutney (3 pieces)",
        category: "South Indian",
        price: 70,
        available: true,
        image_url: "/images/vada-sambar.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Uttapam",
        description: "Thick pancake with vegetables, served with sambar and chutney",
        category: "South Indian",
        price: 80,
        available: true,
        image_url: "/images/uttapam.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },

    // Beverages
    {
        name: "Filter Coffee",
        description: "Traditional South Indian filter coffee",
        category: "Beverages",
        price: 50,
        available: true,
        image_url: "/images/filter-coffee.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Cappuccino",
        description: "Rich espresso with steamed milk foam",
        category: "Beverages",
        price: 80,
        available: true,
        image_url: "/images/cappuccino.jpg",
        preparation_time: 6,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Black Coffee",
        description: "Strong black coffee without milk",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/black-coffee.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Masala Tea",
        description: "Spiced Indian tea with milk",
        category: "Beverages",
        price: 30,
        available: true,
        image_url: "/images/masala-tea.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Green Tea",
        description: "Healthy green tea with antioxidants",
        category: "Beverages",
        price: 35,
        available: true,
        image_url: "/images/green-tea.jpg",
        preparation_time: 4,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Fresh Lime Soda",
        description: "Refreshing lime soda with salt/sugar",
        category: "Beverages",
        price: 45,
        available: true,
        image_url: "/images/lime-soda.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Cold Coffee",
        description: "Chilled coffee with ice cream",
        category: "Beverages",
        price: 70,
        available: true,
        image_url: "/images/cold-coffee.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Mango Lassi",
        description: "Sweet mango yogurt drink",
        category: "Beverages",
        price: 60,
        available: true,
        image_url: "/images/mango-lassi.jpg",
        preparation_time: 4,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Coke",
        description: "Chilled Coca-Cola",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/coke.jpg",
        preparation_time: 1,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Sprite",
        description: "Chilled lemon-lime soda",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/sprite.jpg",
        preparation_time: 1,
        created_at: new Date(),
        updated_at: new Date()
    },

    // Snacks
    {
        name: "French Fries",
        description: "Crispy golden potato fries with ketchup",
        category: "Snacks",
        price: 60,
        available: true,
        image_url: "/images/french-fries.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Wings",
        description: "Spicy fried chicken wings (6 pieces)",
        category: "Snacks",
        price: 150,
        available: true,
        image_url: "/images/chicken-wings.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Onion Rings",
        description: "Crispy battered onion rings",
        category: "Snacks",
        price: 70,
        available: true,
        image_url: "/images/onion-rings.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Spring Rolls",
        description: "Crispy vegetable spring rolls (4 pieces)",
        category: "Snacks",
        price: 80,
        available: true,
        image_url: "/images/spring-rolls.jpg",
        preparation_time: 12,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Samosa",
        description: "Deep fried pastry with spiced potato filling (2 pieces)",
        category: "Snacks",
        price: 40,
        available: true,
        image_url: "/images/samosa.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pakora",
        description: "Mixed vegetable fritters with mint chutney",
        category: "Snacks",
        price: 50,
        available: true,
        image_url: "/images/pakora.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },

    // Desserts
    {
        name: "Vanilla Ice Cream",
        description: "Creamy vanilla ice cream (2 scoops)",
        category: "Desserts",
        price: 70,
        available: true,
        image_url: "/images/vanilla-ice-cream.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chocolate Ice Cream",
        description: "Rich chocolate ice cream (2 scoops)",
        category: "Desserts",
        price: 80,
        available: true,
        image_url: "/images/chocolate-ice-cream.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Gulab Jamun",
        description: "Sweet milk dumplings in sugar syrup (3 pieces)",
        category: "Desserts",
        price: 60,
        available: true,
        image_url: "/images/gulab-jamun.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Ras Malai",
        description: "Soft cottage cheese balls in sweet milk (2 pieces)",
        category: "Desserts",
        price: 80,
        available: true,
        image_url: "/images/ras-malai.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie with vanilla ice cream",
        category: "Desserts",
        price: 90,
        available: true,
        image_url: "/images/chocolate-brownie.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Fruit Salad",
        description: "Fresh seasonal fruits with honey dressing",
        category: "Desserts",
        price: 70,
        available: true,
        image_url: "/images/fruit-salad.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    }
];

const menuResult = db.menu_items.insertMany(menuItems);
print(`Inserted ${menuResult.insertedIds.length} menu items`);

print("Menu seeding completed successfully!");

// Print summary
print("\n=== MENU DATA SUMMARY ===");
print(`Categories: ${db.categories.countDocuments()}`);
print(`Menu Items: ${db.menu_items.countDocuments()}`);

print("\nCategories:");
db.categories.find().forEach(category => {
    print(`- ${category.name} (Order: ${category.display_order})`);
});

print("\nMenu Items by Category:");
const categoryNames = ["Main Course", "South Indian", "Beverages", "Snacks", "Desserts"];
categoryNames.forEach(categoryName => {
    const count = db.menu_items.countDocuments({category: categoryName});
    print(`- ${categoryName}: ${count} items`);
});