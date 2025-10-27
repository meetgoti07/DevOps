-- Payment Service Seed Data for SQLite
INSERT INTO payments (payment_id, order_id, user_id, amount, status, payment_method, created_at, updated_at) VALUES
('PAY_001', 1, 1, 230.00, 'pending', 'credit_card', datetime('now'), datetime('now')),
('PAY_002', 2, 2, 150.00, 'completed', 'debit_card', datetime('now'), datetime('now')),
('PAY_003', 3, 3, 110.00, 'completed', 'upi', datetime('now'), datetime('now')),
('PAY_004', 4, 4, 90.00, 'completed', 'cash', datetime('now'), datetime('now')),
('PAY_005', 5, 5, 200.00, 'completed', 'credit_card', datetime('now'), datetime('now')),
('PAY_006', 6, 1, 75.00, 'failed', 'debit_card', datetime('now'), datetime('now')),
('PAY_007', 7, 3, 180.00, 'refunded', 'upi', datetime('now'), datetime('now'));