package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"queue-service/config"
	"queue-service/handlers"
	"queue-service/repository"
	"queue-service/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize Redis repository
	redisRepo := repository.NewRedisRepository(cfg.RedisURL)
	defer redisRepo.Close()

	// Initialize queue service
	queueService := service.NewQueueService(redisRepo)

	// Initialize WebSocket hub
	wsHub := handlers.NewWebSocketHub()
	go wsHub.Run()

	// Initialize RabbitMQ message broker
	rabbitmqURL := os.Getenv("RABBITMQ_URL")
	if rabbitmqURL != "" {
		messageBroker, err := service.NewMessageBroker(rabbitmqURL, queueService)
		if err != nil {
			log.Printf("Failed to initialize RabbitMQ: %v", err)
		} else {
			err = messageBroker.SetupConsumers()
			if err != nil {
				log.Printf("Failed to setup RabbitMQ consumers: %v", err)
			}
			defer messageBroker.Close()
		}
	} else {
		log.Println("RABBITMQ_URL not set, running without async messaging")
	}

	// Initialize handlers
	queueHandler := handlers.NewQueueHandler(queueService, wsHub)

	// Setup Gin router
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		// Normalize paths so `/path` and `/path/` hit the same handlers
		path := c.Request.URL.Path
		if len(path) > 1 && strings.HasSuffix(path, "/") {
			c.Request.URL.Path = strings.TrimSuffix(path, "/")
		}
	})

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "accept", "origin", "Cache-Control", "X-Requested-With"}
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))

	// API Routes
	api := router.Group("/api/queue")
	{
		api.POST("/", queueHandler.AddToQueue)
		api.GET("/order/:orderId", queueHandler.GetQueueItem)
		api.GET("/active", queueHandler.GetActiveQueue)
		api.PUT("/order/:orderId", queueHandler.UpdateQueueStatus)
		api.DELETE("/order/:orderId", queueHandler.RemoveFromQueue)
		api.GET("/stats", queueHandler.GetQueueStats)
	}

	// WebSocket endpoint
	router.GET("/ws", wsHub.HandleWebSocket)

	// Health check
	router.GET("/health", queueHandler.HealthCheck)

	// Start server
	log.Printf("Queue Service starting on port %s", cfg.Port)
	log.Printf("Redis connected at %s", cfg.RedisURL)

	if err := http.ListenAndServe(":"+cfg.Port, router); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
