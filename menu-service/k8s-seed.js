// MongoDB seed script for Kubernetes deployment
// This script can be executed directly in the MongoDB pod

// Connect to menudb database
db = db.getSiblingDB('menudb');

// Clear existing data
print("Clearing existing data...");
db.categories.deleteMany({});
db.menu_items.deleteMany({});
db.menuitems.deleteMany({});
print("✓ Existing data cleared");

// Insert categories
print("\nInserting categories...");
const categories = [
    {
        name: "Main Course",
        display_order: 1,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "South Indian",
        display_order: 2,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Beverages",
        display_order: 3,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Snacks",
        display_order: 4,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Desserts",
        display_order: 5,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chinese",
        display_order: 6,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pizza",
        display_order: 7,
        active: true,
        created_at: new Date(),
        updated_at: new Date()
    }
];

const categoryResult = db.categories.insertMany(categories);
print(`✓ Inserted ${Object.keys(categoryResult.insertedIds).length} categories`);

// Insert menu items
print("\nInserting menu items...");
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
        name: "Paneer Burger",
        description: "Grilled paneer patty with mint chutney and vegetables",
        category: "Main Course",
        price: 160,
        available: true,
        image_url: "/images/paneer-burger.jpg",
        preparation_time: 13,
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
        name: "Grilled Cheese Sandwich",
        description: "Triple cheese grilled sandwich with herbs",
        category: "Main Course",
        price: 100,
        available: true,
        image_url: "/images/grilled-cheese-sandwich.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pasta Alfredo",
        description: "Creamy white sauce pasta with herbs and parmesan",
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
        name: "Mac and Cheese",
        description: "Creamy macaroni with three cheese blend",
        category: "Main Course",
        price: 140,
        available: true,
        image_url: "/images/mac-cheese.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Biryani",
        description: "Aromatic basmati rice with tender chicken pieces and spices",
        category: "Main Course",
        price: 200,
        available: true,
        image_url: "/images/chicken-biryani.jpg",
        preparation_time: 25,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Biryani",
        description: "Fragrant rice with mixed vegetables and aromatic spices",
        category: "Main Course",
        price: 150,
        available: true,
        image_url: "/images/veg-biryani.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Wrap",
        description: "Grilled chicken wrapped in soft tortilla with veggies",
        category: "Main Course",
        price: 130,
        available: true,
        image_url: "/images/chicken-wrap.jpg",
        preparation_time: 12,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Falafel Wrap",
        description: "Crispy falafel with hummus and fresh vegetables in pita",
        category: "Main Course",
        price: 110,
        available: true,
        image_url: "/images/falafel-wrap.jpg",
        preparation_time: 10,
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
        name: "Mysore Masala Dosa",
        description: "Spicy red chutney dosa with potato filling",
        category: "South Indian",
        price: 100,
        available: true,
        image_url: "/images/mysore-dosa.jpg",
        preparation_time: 13,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Rava Dosa",
        description: "Crispy semolina dosa with onions and spices",
        category: "South Indian",
        price: 85,
        available: true,
        image_url: "/images/rava-dosa.jpg",
        preparation_time: 12,
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
    {
        name: "Upma",
        description: "Savory semolina porridge with vegetables and spices",
        category: "South Indian",
        price: 50,
        available: true,
        image_url: "/images/upma.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pongal",
        description: "Rice and lentil dish tempered with ghee and spices",
        category: "South Indian",
        price: 65,
        available: true,
        image_url: "/images/pongal.jpg",
        preparation_time: 12,
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
        name: "Latte",
        description: "Smooth espresso with steamed milk",
        category: "Beverages",
        price: 85,
        available: true,
        image_url: "/images/latte.jpg",
        preparation_time: 6,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Americano",
        description: "Espresso diluted with hot water",
        category: "Beverages",
        price: 70,
        available: true,
        image_url: "/images/americano.jpg",
        preparation_time: 4,
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
        name: "Lemon Tea",
        description: "Refreshing tea with fresh lemon",
        category: "Beverages",
        price: 35,
        available: true,
        image_url: "/images/lemon-tea.jpg",
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
        name: "Fresh Lime Water",
        description: "Fresh lime juice with water",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/lime-water.jpg",
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
        name: "Iced Tea",
        description: "Refreshing chilled tea with lemon",
        category: "Beverages",
        price: 50,
        available: true,
        image_url: "/images/iced-tea.jpg",
        preparation_time: 4,
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
        name: "Sweet Lassi",
        description: "Traditional sweet yogurt drink",
        category: "Beverages",
        price: 50,
        available: true,
        image_url: "/images/sweet-lassi.jpg",
        preparation_time: 4,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Salted Lassi",
        description: "Savory yogurt drink with spices",
        category: "Beverages",
        price: 50,
        available: true,
        image_url: "/images/salted-lassi.jpg",
        preparation_time: 4,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Badam Milk",
        description: "Almond milk with saffron",
        category: "Beverages",
        price: 65,
        available: true,
        image_url: "/images/badam-milk.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Milkshake - Chocolate",
        description: "Rich chocolate milkshake",
        category: "Beverages",
        price: 80,
        available: true,
        image_url: "/images/chocolate-shake.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Milkshake - Vanilla",
        description: "Creamy vanilla milkshake",
        category: "Beverages",
        price: 75,
        available: true,
        image_url: "/images/vanilla-shake.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Milkshake - Strawberry",
        description: "Fresh strawberry milkshake",
        category: "Beverages",
        price: 85,
        available: true,
        image_url: "/images/strawberry-shake.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Fresh Orange Juice",
        description: "Freshly squeezed orange juice",
        category: "Beverages",
        price: 70,
        available: true,
        image_url: "/images/orange-juice.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Watermelon Juice",
        description: "Refreshing watermelon juice",
        category: "Beverages",
        price: 60,
        available: true,
        image_url: "/images/watermelon-juice.jpg",
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
    {
        name: "Thumbs Up",
        description: "Strong cola drink",
        category: "Beverages",
        price: 40,
        available: true,
        image_url: "/images/thumbs-up.jpg",
        preparation_time: 1,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Mineral Water",
        description: "Packaged drinking water (1L)",
        category: "Beverages",
        price: 20,
        available: true,
        image_url: "/images/water-bottle.jpg",
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
        name: "Peri Peri Fries",
        description: "Spicy peri peri seasoned fries",
        category: "Snacks",
        price: 75,
        available: true,
        image_url: "/images/peri-peri-fries.jpg",
        preparation_time: 9,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Cheese Fries",
        description: "French fries topped with melted cheese",
        category: "Snacks",
        price: 90,
        available: true,
        image_url: "/images/cheese-fries.jpg",
        preparation_time: 10,
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
        name: "Chicken Nuggets",
        description: "Crispy fried chicken nuggets (8 pieces)",
        category: "Snacks",
        price: 120,
        available: true,
        image_url: "/images/chicken-nuggets.jpg",
        preparation_time: 12,
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
    {
        name: "Paneer Tikka",
        description: "Grilled cottage cheese with spices (6 pieces)",
        category: "Snacks",
        price: 130,
        available: true,
        image_url: "/images/paneer-tikka.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Cutlet",
        description: "Crispy vegetable cutlets (3 pieces)",
        category: "Snacks",
        price: 60,
        available: true,
        image_url: "/images/veg-cutlet.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Aloo Tikki",
        description: "Spiced potato patties (3 pieces)",
        category: "Snacks",
        price: 55,
        available: true,
        image_url: "/images/aloo-tikki.jpg",
        preparation_time: 10,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Nachos with Cheese",
        description: "Crispy nachos with melted cheese sauce",
        category: "Snacks",
        price: 95,
        available: true,
        image_url: "/images/nachos-cheese.jpg",
        preparation_time: 8,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Loaded Nachos",
        description: "Nachos with cheese, salsa, jalapenos, and sour cream",
        category: "Snacks",
        price: 130,
        available: true,
        image_url: "/images/loaded-nachos.jpg",
        preparation_time: 12,
        created_at: new Date(),
        updated_at: new Date()
    },

    // Chinese
    {
        name: "Chicken Fried Rice",
        description: "Stir-fried rice with chicken and vegetables",
        category: "Chinese",
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
        category: "Chinese",
        price: 130,
        available: true,
        image_url: "/images/veg-fried-rice.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Egg Fried Rice",
        description: "Fried rice with scrambled eggs",
        category: "Chinese",
        price: 140,
        available: true,
        image_url: "/images/egg-fried-rice.jpg",
        preparation_time: 16,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Schezwan Fried Rice",
        description: "Spicy fried rice with schezwan sauce",
        category: "Chinese",
        price: 150,
        available: true,
        image_url: "/images/schezwan-fried-rice.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Noodles",
        description: "Stir-fried noodles with chicken and vegetables",
        category: "Chinese",
        price: 170,
        available: true,
        image_url: "/images/chicken-noodles.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Noodles",
        description: "Stir-fried noodles with mixed vegetables",
        category: "Chinese",
        price: 130,
        available: true,
        image_url: "/images/veg-noodles.jpg",
        preparation_time: 15,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Hakka Noodles",
        description: "Hakka style stir-fried noodles",
        category: "Chinese",
        price: 140,
        available: true,
        image_url: "/images/hakka-noodles.jpg",
        preparation_time: 16,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Schezwan Noodles",
        description: "Spicy noodles with schezwan sauce",
        category: "Chinese",
        price: 150,
        available: true,
        image_url: "/images/schezwan-noodles.jpg",
        preparation_time: 17,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veg Manchurian",
        description: "Deep fried veggie balls in spicy sauce",
        category: "Chinese",
        price: 120,
        available: true,
        image_url: "/images/veg-manchurian.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Manchurian",
        description: "Chicken balls in spicy Indo-Chinese sauce",
        category: "Chinese",
        price: 160,
        available: true,
        image_url: "/images/chicken-manchurian.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chilli Chicken",
        description: "Spicy chicken with bell peppers and onions",
        category: "Chinese",
        price: 170,
        available: true,
        image_url: "/images/chilli-chicken.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chilli Paneer",
        description: "Cottage cheese in spicy sauce with peppers",
        category: "Chinese",
        price: 140,
        available: true,
        image_url: "/images/chilli-paneer.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Gobi Manchurian",
        description: "Crispy cauliflower in spicy Manchurian sauce",
        category: "Chinese",
        price: 110,
        available: true,
        image_url: "/images/gobi-manchurian.jpg",
        preparation_time: 18,
        created_at: new Date(),
        updated_at: new Date()
    },

    // Pizza
    {
        name: "Margherita Pizza",
        description: "Classic pizza with tomato sauce, mozzarella, and basil",
        category: "Pizza",
        price: 200,
        available: true,
        image_url: "/images/margherita-pizza.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Farmhouse Pizza",
        description: "Loaded with fresh vegetables and cheese",
        category: "Pizza",
        price: 220,
        available: true,
        image_url: "/images/farmhouse-pizza.jpg",
        preparation_time: 22,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Peppy Paneer Pizza",
        description: "Spiced paneer with capsicum and onions",
        category: "Pizza",
        price: 230,
        available: true,
        image_url: "/images/paneer-pizza.jpg",
        preparation_time: 22,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chicken Tikka Pizza",
        description: "Tandoori chicken with onions and peppers",
        category: "Pizza",
        price: 260,
        available: true,
        image_url: "/images/chicken-tikka-pizza.jpg",
        preparation_time: 23,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "BBQ Chicken Pizza",
        description: "BBQ chicken with onions and BBQ sauce",
        category: "Pizza",
        price: 270,
        available: true,
        image_url: "/images/bbq-chicken-pizza.jpg",
        preparation_time: 23,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Pepperoni Pizza",
        description: "Classic pepperoni with extra cheese",
        category: "Pizza",
        price: 280,
        available: true,
        image_url: "/images/pepperoni-pizza.jpg",
        preparation_time: 22,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Veggie Supreme Pizza",
        description: "Loaded with assorted vegetables and olives",
        category: "Pizza",
        price: 240,
        available: true,
        image_url: "/images/veggie-supreme-pizza.jpg",
        preparation_time: 23,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Four Cheese Pizza",
        description: "Mozzarella, cheddar, parmesan, and feta",
        category: "Pizza",
        price: 250,
        available: true,
        image_url: "/images/four-cheese-pizza.jpg",
        preparation_time: 21,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Corn and Cheese Pizza",
        description: "Sweet corn with extra mozzarella cheese",
        category: "Pizza",
        price: 210,
        available: true,
        image_url: "/images/corn-pizza.jpg",
        preparation_time: 20,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Mexican Wave Pizza",
        description: "Jalapenos, onions, capsicum with salsa sauce",
        category: "Pizza",
        price: 235,
        available: true,
        image_url: "/images/mexican-pizza.jpg",
        preparation_time: 22,
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
        name: "Strawberry Ice Cream",
        description: "Fresh strawberry ice cream (2 scoops)",
        category: "Desserts",
        price: 85,
        available: true,
        image_url: "/images/strawberry-ice-cream.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Mango Ice Cream",
        description: "Real mango pulp ice cream (2 scoops)",
        category: "Desserts",
        price: 85,
        available: true,
        image_url: "/images/mango-ice-cream.jpg",
        preparation_time: 2,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Butterscotch Ice Cream",
        description: "Butterscotch flavored ice cream (2 scoops)",
        category: "Desserts",
        price: 80,
        available: true,
        image_url: "/images/butterscotch-ice-cream.jpg",
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
        name: "Brownie with Ice Cream",
        description: "Chocolate brownie topped with ice cream and chocolate sauce",
        category: "Desserts",
        price: 120,
        available: true,
        image_url: "/images/brownie-ice-cream.jpg",
        preparation_time: 10,
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
    },
    {
        name: "Gajar Halwa",
        description: "Carrot pudding with dry fruits",
        category: "Desserts",
        price: 75,
        available: true,
        image_url: "/images/gajar-halwa.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Kheer",
        description: "Rice pudding with cardamom and dry fruits",
        category: "Desserts",
        price: 65,
        available: true,
        image_url: "/images/kheer.jpg",
        preparation_time: 5,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Tiramisu",
        description: "Italian coffee-flavored dessert",
        category: "Desserts",
        price: 110,
        available: true,
        image_url: "/images/tiramisu.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Chocolate Mousse",
        description: "Rich chocolate mousse with whipped cream",
        category: "Desserts",
        price: 100,
        available: true,
        image_url: "/images/chocolate-mousse.jpg",
        preparation_time: 4,
        created_at: new Date(),
        updated_at: new Date()
    },
    {
        name: "Cheesecake",
        description: "Classic New York style cheesecake",
        category: "Desserts",
        price: 120,
        available: true,
        image_url: "/images/cheesecake.jpg",
        preparation_time: 3,
        created_at: new Date(),
        updated_at: new Date()
    }
];

const menuResult = db.menu_items.insertMany(menuItems);
print(`✓ Inserted ${Object.keys(menuResult.insertedIds).length} menu items`);

print("\n=== SEEDING COMPLETED SUCCESSFULLY ===");
print(`Total Categories: ${db.categories.countDocuments()}`);
print(`Total Menu Items: ${db.menu_items.countDocuments()}`);

print("\n=== Categories Summary ===");
db.categories.find().forEach(function(category) {
    const itemCount = db.menu_items.countDocuments({ category: category.name });
    print(`${category.name}: ${itemCount} items`);
});

print("\n✓ Database seeded successfully!");
