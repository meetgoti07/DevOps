package models

import (
	"time"
)

type QueueItem struct {
	OrderID          int       `json:"order_id"`
	UserID           int       `json:"user_id"`
	QueueNumber      int       `json:"queue_number"`
	EstimatedWaitTime int      `json:"estimated_wait_time"` // in minutes
	Status           string    `json:"status"`
	CreatedAt        time.Time `json:"created_at"`
}

type QueueStats struct {
	TotalOrdersToday   int     `json:"total_orders_today"`
	AverageWaitTime    float64 `json:"average_wait_time"`
	ActiveOrdersCount  int     `json:"active_orders_count"`
}

type AddQueueRequest struct {
	OrderID int `json:"order_id" binding:"required"`
	UserID  int `json:"user_id" binding:"required"`
}

type UpdateQueueStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type WebSocketMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

const (
	StatusWaiting   = "waiting"
	StatusPreparing = "preparing"
	StatusReady     = "ready"
	StatusCompleted = "completed"
)