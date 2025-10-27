package config

import (
	"os"
)

type Config struct {
	Port     string
	RedisURL string
}

func Load() *Config {
	config := &Config{
		Port:     getEnv("PORT", "8084"),
		RedisURL: getEnv("REDIS_URL", "localhost:6379"),
	}
	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}