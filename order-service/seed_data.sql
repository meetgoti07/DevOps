-- Order Service Seed Data for MySQL
-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status, payment_id, queue_number, created_at, updated_at) VALUES
(1, 230.00, 'pending', 'PAY_001', 1, NOW(), NOW()),
(2, 150.00, 'confirmed', 'PAY_002', 2, NOW(), NOW()),
(3, 110.00, 'preparing', 'PAY_003', 3, NOW(), NOW()),
(4, 90.00, 'ready', 'PAY_004', 4, NOW(), NOW()),
(5, 200.00, 'completed', 'PAY_005', NULL, NOW(), NOW());

-- Insert order items
INSERT INTO order_items (menu_item_id, item_name, quantity, price, order_id) VALUES
-- Order 1 items (user_id 1)
('68e15ba449fa7b60134f8802', 'Chicken Burger', 1, 150.00, 1),
('68e15ba449fa7b60134f8804', 'Coffee', 1, 50.00, 1),
('68e15ba449fa7b60134f8806', 'French Fries', 1, 30.00, 1),

-- Order 2 items (user_id 2)
('68e15ba449fa7b60134f8802', 'Chicken Burger', 1, 150.00, 2),

-- Order 3 items (user_id 3)
('68e15ba449fa7b60134f8803', 'Veg Sandwich', 1, 80.00, 3),
('68e15ba449fa7b60134f8808', 'Tea', 1, 30.00, 3),

-- Order 4 items (user_id 4)
('68e15ba449fa7b60134f8803', 'Veg Sandwich', 1, 80.00, 4),

-- Order 5 items (user_id 5)
('68e15ba449fa7b60134f8807', 'Pasta', 1, 120.00, 5),
('68e15ba449fa7b60134f8804', 'Coffee', 1, 50.00, 5),
('68e15ba449fa7b60134f8808', 'Tea', 1, 30.00, 5);