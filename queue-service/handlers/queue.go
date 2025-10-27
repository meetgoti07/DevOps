package handlers

import (
	"net/http"
	"strconv"

	"queue-service/models"
	"queue-service/service"

	"github.com/gin-gonic/gin"
)

type QueueHandler struct {
	queueService *service.QueueService
	wsHub        *WebSocketHub
}

func NewQueueHandler(queueService *service.QueueService, wsHub *WebSocketHub) *QueueHandler {
	return &QueueHandler{
		queueService: queueService,
		wsHub:        wsHub,
	}
}

func (h *QueueHandler) AddToQueue(c *gin.Context) {
	var req models.AddQueueRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	queueItem, err := h.queueService.AddToQueue(req.OrderID, req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast queue update via WebSocket
	h.wsHub.Broadcast(models.WebSocketMessage{
		Type: "queue_update",
		Data: queueItem,
	})

	c.JSON(http.StatusCreated, queueItem)
}

func (h *QueueHandler) GetQueueItem(c *gin.Context) {
	orderIDStr := c.Param("orderId")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	queueItem, err := h.queueService.GetQueueItem(orderID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, queueItem)
}

func (h *QueueHandler) GetActiveQueue(c *gin.Context) {
	queueItems, err := h.queueService.GetActiveQueue()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, queueItems)
}

func (h *QueueHandler) UpdateQueueStatus(c *gin.Context) {
	orderIDStr := c.Param("orderId")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var req models.UpdateQueueStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = h.queueService.UpdateQueueStatus(orderID, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get updated queue item
	queueItem, err := h.queueService.GetQueueItem(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast status update via WebSocket
	h.wsHub.Broadcast(models.WebSocketMessage{
		Type: "status_update",
		Data: queueItem,
	})

	c.JSON(http.StatusOK, queueItem)
}

func (h *QueueHandler) RemoveFromQueue(c *gin.Context) {
	orderIDStr := c.Param("orderId")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	err = h.queueService.RemoveFromQueue(orderID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast queue removal via WebSocket
	h.wsHub.Broadcast(models.WebSocketMessage{
		Type: "queue_removed",
		Data: gin.H{"order_id": orderID},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Order removed from queue successfully"})
}

func (h *QueueHandler) GetQueueStats(c *gin.Context) {
	stats, err := h.queueService.GetQueueStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

func (h *QueueHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "OK",
		"service":   "Queue Service",
		"timestamp": c.GetHeader("Date"),
	})
}