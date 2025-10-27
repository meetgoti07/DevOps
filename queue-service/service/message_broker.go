package service

import (
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

type MessageBroker struct {
	connection  *amqp.Connection
	channel     *amqp.Channel
	queueService *QueueService
}

type OrderMessage struct {
	EventType           string                 `json:"event_type"`
	OrderID             int                    `json:"order_id"`
	UserID              int                    `json:"user_id"`
	OldStatus           string                 `json:"old_status,omitempty"`
	NewStatus           string                 `json:"new_status,omitempty"`
	TotalAmount         float64                `json:"total_amount,omitempty"`
	QueueNumber         int                    `json:"queue_number,omitempty"`
	Items               []map[string]interface{} `json:"items,omitempty"`
	SpecialInstructions string                 `json:"special_instructions,omitempty"`
	Timestamp           string                 `json:"timestamp,omitempty"`
}

func NewMessageBroker(rabbitmqURL string, queueService *QueueService) (*MessageBroker, error) {
	conn, err := amqp.Dial(rabbitmqURL)
	if err != nil {
		return nil, err
	}

	ch, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	// Declare exchange
	err = ch.ExchangeDeclare(
		"canteen.orders", // name
		"topic",          // type
		true,             // durable
		false,            // auto-deleted
		false,            // internal
		false,            // no-wait
		nil,              // arguments
	)
	if err != nil {
		ch.Close()
		conn.Close()
		return nil, err
	}

	return &MessageBroker{
		connection:   conn,
		channel:      ch,
		queueService: queueService,
	}, nil
}

func (mb *MessageBroker) SetupConsumers() error {
	// Queue for order events that affect the queue
	queueName := "queue.service.orders"
	
	// Declare queue
	_, err := mb.channel.QueueDeclare(
		queueName, // name
		true,      // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		return err
	}

	// Bind queue to routing keys we're interested in
	routingKeys := []string{
		"order.confirmed",  // When order is confirmed, add to queue
		"order.completed",  // When order is completed, remove from queue
		"order.cancelled",  // When order is cancelled, remove from queue
	}

	for _, routingKey := range routingKeys {
		err = mb.channel.QueueBind(
			queueName,        // queue name
			routingKey,       // routing key
			"canteen.orders", // exchange
			false,
			nil,
		)
		if err != nil {
			return err
		}
	}

	// Start consuming
	msgs, err := mb.channel.Consume(
		queueName, // queue
		"",        // consumer
		false,     // auto-ack
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)
	if err != nil {
		return err
	}

	go func() {
		for msg := range msgs {
			mb.handleOrderMessage(msg)
		}
	}()

	log.Println("Queue Service: RabbitMQ consumers set up")
	return nil
}

func (mb *MessageBroker) handleOrderMessage(delivery amqp.Delivery) {
	var orderMsg OrderMessage
	
	err := json.Unmarshal(delivery.Body, &orderMsg)
	if err != nil {
		log.Printf("Failed to unmarshal order message: %v", err)
		delivery.Nack(false, false) // Don't requeue
		return
	}

	log.Printf("Received order message: %s for order %d", orderMsg.EventType, orderMsg.OrderID)

	switch orderMsg.NewStatus {
	case "confirmed":
		// Add order to queue when confirmed (payment successful)
		_, err = mb.queueService.AddToQueue(orderMsg.OrderID, orderMsg.UserID)
		if err != nil {
			log.Printf("Failed to add order %d to queue: %v", orderMsg.OrderID, err)
			delivery.Nack(false, true) // Requeue for retry
			return
		}
		log.Printf("Added order %d to queue", orderMsg.OrderID)

	case "completed", "cancelled":
		// Remove order from queue when completed or cancelled
		err = mb.queueService.RemoveFromQueue(orderMsg.OrderID)
		if err != nil {
			log.Printf("Failed to remove order %d from queue: %v", orderMsg.OrderID, err)
			// Don't nack for removal failures as order might not be in queue
		} else {
			log.Printf("Removed order %d from queue", orderMsg.OrderID)
		}
	}

	// Acknowledge message
	delivery.Ack(false)
}

func (mb *MessageBroker) Close() {
	if mb.channel != nil {
		mb.channel.Close()
	}
	if mb.connection != nil {
		mb.connection.Close()
	}
}