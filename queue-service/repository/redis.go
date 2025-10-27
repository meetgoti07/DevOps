package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"queue-service/models"

	"github.com/go-redis/redis/v8"
)

type RedisRepository struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisRepository(redisURL string) *RedisRepository {
	rdb := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	ctx := context.Background()

	// Test connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}

	log.Println("Connected to Redis successfully")

	return &RedisRepository{
		client: rdb,
		ctx:    ctx,
	}
}

func (r *RedisRepository) AddToQueue(orderID, userID int) (*models.QueueItem, error) {
	// Generate queue number
	queueNumber, err := r.client.Incr(r.ctx, "queue:counter").Result()
	if err != nil {
		return nil, fmt.Errorf("failed to generate queue number: %v", err)
	}

	// Calculate estimated wait time (5 minutes per order ahead)
	activeCount, _ := r.GetActiveOrdersCount()
	estimatedWaitTime := activeCount * 5

	queueItem := &models.QueueItem{
		OrderID:           orderID,
		UserID:            userID,
		QueueNumber:       int(queueNumber),
		EstimatedWaitTime: estimatedWaitTime,
		Status:           models.StatusWaiting,
		CreatedAt:        time.Now(),
	}

	// Add to sorted set with timestamp as score
	score := float64(time.Now().Unix())
	err = r.client.ZAdd(r.ctx, "queue:active", &redis.Z{
		Score:  score,
		Member: strconv.Itoa(orderID),
	}).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to add to active queue: %v", err)
	}

	// Store order details
	queueKey := fmt.Sprintf("queue:order:%d", orderID)
	queueData, err := json.Marshal(queueItem)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal queue item: %v", err)
	}

	err = r.client.HMSet(r.ctx, queueKey, map[string]interface{}{
		"order_id":            orderID,
		"user_id":             userID,
		"queue_number":        queueNumber,
		"estimated_wait_time": estimatedWaitTime,
		"status":             models.StatusWaiting,
		"created_at":         time.Now().Format(time.RFC3339),
		"data":               string(queueData),
	}).Err()
	if err != nil {
		return nil, fmt.Errorf("failed to store queue item: %v", err)
	}

	// Update stats
	r.updateStats()

	return queueItem, nil
}

func (r *RedisRepository) GetQueueItem(orderID int) (*models.QueueItem, error) {
	queueKey := fmt.Sprintf("queue:order:%d", orderID)
	
	data, err := r.client.HGet(r.ctx, queueKey, "data").Result()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("queue item not found")
		}
		return nil, fmt.Errorf("failed to get queue item: %v", err)
	}

	var queueItem models.QueueItem
	err = json.Unmarshal([]byte(data), &queueItem)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal queue item: %v", err)
	}

	// Update estimated wait time based on current position
	position, err := r.getQueuePosition(orderID)
	if err == nil {
		queueItem.EstimatedWaitTime = position * 5
	}

	return &queueItem, nil
}

func (r *RedisRepository) GetActiveQueue() ([]models.QueueItem, error) {
	// Get all active orders sorted by timestamp
	orderIDs, err := r.client.ZRange(r.ctx, "queue:active", 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get active queue: %v", err)
	}

	var queueItems []models.QueueItem
	for _, orderIDStr := range orderIDs {
		orderID, err := strconv.Atoi(orderIDStr)
		if err != nil {
			continue
		}

		queueItem, err := r.GetQueueItem(orderID)
		if err != nil {
			continue
		}

		queueItems = append(queueItems, *queueItem)
	}

	return queueItems, nil
}

func (r *RedisRepository) UpdateQueueStatus(orderID int, status string) error {
	queueKey := fmt.Sprintf("queue:order:%d", orderID)
	
	// Check if item exists
	exists, err := r.client.Exists(r.ctx, queueKey).Result()
	if err != nil {
		return fmt.Errorf("failed to check queue item existence: %v", err)
	}
	if exists == 0 {
		return fmt.Errorf("queue item not found")
	}

	// Update status
	err = r.client.HSet(r.ctx, queueKey, "status", status).Err()
	if err != nil {
		return fmt.Errorf("failed to update status: %v", err)
	}

	// Update the data field with new status
	queueItem, err := r.GetQueueItem(orderID)
	if err != nil {
		return err
	}
	queueItem.Status = status

	queueData, err := json.Marshal(queueItem)
	if err != nil {
		return fmt.Errorf("failed to marshal updated queue item: %v", err)
	}

	err = r.client.HSet(r.ctx, queueKey, "data", string(queueData)).Err()
	if err != nil {
		return fmt.Errorf("failed to update queue item data: %v", err)
	}

	return nil
}

func (r *RedisRepository) RemoveFromQueue(orderID int) error {
	// Remove from active queue
	err := r.client.ZRem(r.ctx, "queue:active", strconv.Itoa(orderID)).Err()
	if err != nil {
		return fmt.Errorf("failed to remove from active queue: %v", err)
	}

	// Remove order details
	queueKey := fmt.Sprintf("queue:order:%d", orderID)
	err = r.client.Del(r.ctx, queueKey).Err()
	if err != nil {
		return fmt.Errorf("failed to remove queue item: %v", err)
	}

	// Update stats
	r.updateStats()

	return nil
}

func (r *RedisRepository) GetQueueStats() (*models.QueueStats, error) {
	statsKey := "queue:stats"
	
	data, err := r.client.HGetAll(r.ctx, statsKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get queue stats: %v", err)
	}

	stats := &models.QueueStats{}
	
	if val, exists := data["total_orders_today"]; exists {
		stats.TotalOrdersToday, _ = strconv.Atoi(val)
	}
	
	if val, exists := data["average_wait_time"]; exists {
		stats.AverageWaitTime, _ = strconv.ParseFloat(val, 64)
	}
	
	if val, exists := data["active_orders_count"]; exists {
		stats.ActiveOrdersCount, _ = strconv.Atoi(val)
	}

	return stats, nil
}

func (r *RedisRepository) GetActiveOrdersCount() (int, error) {
	count, err := r.client.ZCard(r.ctx, "queue:active").Result()
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

func (r *RedisRepository) getQueuePosition(orderID int) (int, error) {
	position, err := r.client.ZRank(r.ctx, "queue:active", strconv.Itoa(orderID)).Result()
	if err != nil {
		return 0, err
	}
	return int(position), nil
}

func (r *RedisRepository) updateStats() {
	activeCount, _ := r.GetActiveOrdersCount()
	
	statsKey := "queue:stats"
	r.client.HSet(r.ctx, statsKey, map[string]interface{}{
		"active_orders_count": activeCount,
		"average_wait_time":   float64(activeCount * 5),
	})
}

func (r *RedisRepository) Close() error {
	return r.client.Close()
}