#!/bin/bash

# Redis Queue Service Seed Data
# This script sets up the queue data structure in Redis

echo "Setting up Redis queue data..."

# Set up queue configuration
docker exec -it canteen-redis redis-cli SET queue:config:max_size 50
docker exec -it canteen-redis redis-cli SET queue:config:processing_time 300

# Set up current queue with orders that are pending, confirmed, preparing, or ready
docker exec -it canteen-redis redis-cli LPUSH queue:orders 1
docker exec -it canteen-redis redis-cli LPUSH queue:orders 2
docker exec -it canteen-redis redis-cli LPUSH queue:orders 3
docker exec -it canteen-redis redis-cli LPUSH queue:orders 4

# Set up queue metadata for each order
docker exec -it canteen-redis redis-cli HSET queue:order:1 order_id 1 user_id 1 status "pending" queue_number 1 estimated_time 15 created_at "$(date -Iseconds)"
docker exec -it canteen-redis redis-cli HSET queue:order:2 order_id 2 user_id 2 status "confirmed" queue_number 2 estimated_time 12 created_at "$(date -Iseconds)"
docker exec -it canteen-redis redis-cli HSET queue:order:3 order_id 3 user_id 3 status "preparing" queue_number 3 estimated_time 8 created_at "$(date -Iseconds)"
docker exec -it canteen-redis redis-cli HSET queue:order:4 order_id 4 user_id 4 status "ready" queue_number 4 estimated_time 0 created_at "$(date -Iseconds)"

# Set up user's active orders mapping
docker exec -it canteen-redis redis-cli SET user:1:active_order 1
docker exec -it canteen-redis redis-cli SET user:2:active_order 2
docker exec -it canteen-redis redis-cli SET user:3:active_order 3
docker exec -it canteen-redis redis-cli SET user:4:active_order 4

# Set up queue statistics
docker exec -it canteen-redis redis-cli SET queue:stats:total_orders 5
docker exec -it canteen-redis redis-cli SET queue:stats:completed_orders 1
docker exec -it canteen-redis redis-cli SET queue:stats:active_orders 4

# Set up kitchen status
docker exec -it canteen-redis redis-cli HSET kitchen:status orders_in_queue 4 average_prep_time 12 current_load "medium"

echo "Redis queue data seeded successfully!"
echo "Queue orders: $(docker exec -it canteen-redis redis-cli LRANGE queue:orders 0 -1)"
echo "Queue length: $(docker exec -it canteen-redis redis-cli LLEN queue:orders)"