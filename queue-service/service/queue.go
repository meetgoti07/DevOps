package service

import (
	"queue-service/models"
	"queue-service/repository"
)

type QueueService struct {
	repo *repository.RedisRepository
}

func NewQueueService(repo *repository.RedisRepository) *QueueService {
	return &QueueService{
		repo: repo,
	}
}

func (s *QueueService) AddToQueue(orderID, userID int) (*models.QueueItem, error) {
	return s.repo.AddToQueue(orderID, userID)
}

func (s *QueueService) GetQueueItem(orderID int) (*models.QueueItem, error) {
	return s.repo.GetQueueItem(orderID)
}

func (s *QueueService) GetActiveQueue() ([]models.QueueItem, error) {
	return s.repo.GetActiveQueue()
}

func (s *QueueService) UpdateQueueStatus(orderID int, status string) error {
	return s.repo.UpdateQueueStatus(orderID, status)
}

func (s *QueueService) RemoveFromQueue(orderID int) error {
	return s.repo.RemoveFromQueue(orderID)
}

func (s *QueueService) GetQueueStats() (*models.QueueStats, error) {
	return s.repo.GetQueueStats()
}