# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Canteen Queue Manager is a microservices-based application demonstrating polyglot architecture, event-driven design, and cloud-native deployment patterns. The system eliminates physical queuing by providing real-time order management, queue tracking, and payment processing across five independent microservices.

## Architecture

### Microservices Stack (Polyglot)

```
Frontend (Next.js 15) → API Gateway (NGINX) → Microservices
                                            ↓
                      ┌─────────────────────┼─────────────────────┐
                      │                     │                     │
              User Service            Menu Service          Order Service
              (Java/Spring)           (Node.js)             (Django)
              PostgreSQL              MongoDB               MySQL
                      │                     │                     │
                      └─────────────────────┼─────────────────────┘
                                            ↓
                                    RabbitMQ (Message Broker)
                                            ↓
                      ┌─────────────────────┼─────────────────────┐
                      │                     │                     │
                Queue Service         Payment Service
                (Go)                  (Flask)
                Redis                 SQLite
```

### Communication Patterns

1. **Synchronous (REST)**: All services expose REST APIs for request/response
2. **Asynchronous (RabbitMQ)**: Event-driven communication between Order, Queue, and Payment services
3. **Real-time (WebSocket)**: Queue Service broadcasts live updates to clients

### Key Design Patterns

- **Database per Service**: Each microservice owns its database (polyglot persistence)
- **API Gateway**: Single entry point routing to all backend services
- **Event Sourcing**: Order state changes published to RabbitMQ message broker
- **Service Discovery**: Environment-based configuration in Docker Compose/Kubernetes

## Development Commands

### Local Development (Docker Compose)

```bash
# Start all services
docker-compose up --build

# Start specific service
docker-compose up user-service postgres

# View logs
docker-compose logs -f order-service

# Restart service after code changes
docker-compose restart order-service

# Access RabbitMQ Management UI
open http://localhost:15672  # admin/admin123
```

### Individual Service Development

**User Service (Java/Spring Boot)**
```bash
cd user-service
./mvnw clean install          # Build
./mvnw spring-boot:run        # Run locally (requires PostgreSQL on 5432)
./mvnw test                   # Run tests
```

**Menu Service (Node.js)**
```bash
cd menu-service
npm install
npm start                     # Production
npm run dev                   # Development with nodemon
```

**Order Service (Django)**
```bash
cd order-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8083
```

**Queue Service (Go)**
```bash
cd queue-service
go mod download
go run main.go                # Run
go build -o queue-service     # Build binary
```

**Payment Service (Flask)**
```bash
cd payment-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev                   # Development with Turbopack
npm run build                 # Production build
npm start                     # Serve production build
```

### Testing

```bash
# Java (User Service)
cd user-service && ./mvnw test

# Python (Order/Payment Services)
cd order-service && python manage.py test
cd payment-service && pytest  # (if configured)

# Go (Queue Service)
cd queue-service && go test ./...

# Frontend (Next.js)
cd frontend && npm test  # (if configured)
```

## Deployment

### GCP/GKE Deployment

```bash
# One-time setup
./setup-gcp.sh                              # Configure GCP project

# Infrastructure (Terraform)
cd terraform
terraform init
terraform apply

# Build and push images to GCR
./build-and-push.sh YOUR_PROJECT_ID

# Deploy to Kubernetes
cd kubernetes
./update-project-id.sh YOUR_PROJECT_ID
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml mongodb.yaml mysql.yaml redis.yaml rabbitmq.yaml
kubectl apply -f microservices.yaml
kubectl apply -f frontend-gateway.yaml

# Get external IP
kubectl get service api-gateway -n canteen-system
```

### Kubernetes Operations

```bash
# View deployments
kubectl get pods -n canteen-system
kubectl get services -n canteen-system

# Logs
kubectl logs -f deployment/order-service -n canteen-system

# Scale service
kubectl scale deployment/order-service --replicas=3 -n canteen-system

# Restart deployment
kubectl rollout restart deployment/order-service -n canteen-system

# Access database
kubectl exec -it deployment/postgres -n canteen-system -- psql -U admin -d userdb
```

## Critical Configuration Files

### Service Ports (Local)
- Frontend: 3000
- API Gateway: 80, 8080
- User Service: 8081
- Menu Service: 8082
- Order Service: 8083
- Queue Service: 8084
- Payment Service: 8085
- RabbitMQ: 5672 (AMQP), 15672 (Management UI)

### Environment Variables

**User Service** (Spring Boot `application.properties`)
- `SPRING_DATASOURCE_URL`: PostgreSQL connection
- `JWT_SECRET`: JWT signing key

**Menu Service** (Node.js `.env`)
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Service port (8082)

**Order Service** (Django `settings.py`)
- `DATABASE_URL`: MySQL connection
- `RABBITMQ_URL`: Message broker connection
- `QUEUE_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `MENU_SERVICE_URL`: Service URLs

**Queue Service** (Go environment)
- `REDIS_URL`: Redis connection
- `RABBITMQ_URL`: Message broker connection
- `PORT`: Service port (8084)

**Payment Service** (Flask `config.py`)
- `DATABASE_PATH`: SQLite database path
- `RABBITMQ_URL`: Message broker connection
- `ORDER_SERVICE_URL`: Order service callback URL

**Frontend** (Next.js `.env.local`)
- `NEXT_PUBLIC_USER_SERVICE_URL`: http://localhost:8081
- `NEXT_PUBLIC_MENU_SERVICE_URL`: http://localhost:8082
- `NEXT_PUBLIC_ORDER_SERVICE_URL`: http://localhost:8083
- `NEXT_PUBLIC_QUEUE_SERVICE_URL`: http://localhost:8084
- `NEXT_PUBLIC_PAYMENT_SERVICE_URL`: http://localhost:8085

## RabbitMQ Message Flow

### Exchange: `canteen.orders` (Topic)

**Published by Order Service:**
- `order.created` → Logged
- `payment.initiated` → Consumed by Payment Service
- `order.confirmed` → Consumed by Queue Service
- `order.preparing` → Consumed by Queue Service
- `order.ready` → Consumed by Queue Service
- `order.completed` → Consumed by Queue Service
- `order.cancelled` → Consumed by Queue Service

**Published by Payment Service:**
- `payment.success` → Consumed by Order Service
- `payment.failed` → Consumed by Order Service

### Message Payload Structure
```json
{
  "event_type": "order_confirmed",
  "order_id": 123,
  "user_id": 45,
  "old_status": "placed",
  "new_status": "confirmed",
  "total_amount": 25.5,
  "timestamp": "2025-10-10T10:00:00Z",
  "items": [...]
}
```

## Database Schemas

### PostgreSQL (User Service) - `userdb`
- **users** table: id, email, password_hash, full_name, phone, role (CUSTOMER/STAFF/ADMIN), created_at

### MongoDB (Menu Service) - `menudb`
- **categories** collection: _id, name, display_order, active, created_at
- **items** collection: _id, name, description, category, price, available, image_url, preparation_time

### MySQL (Order Service) - `orderdb`
- **orders** table: id, user_id, total_amount, status, special_instructions, created_at
- **order_items** table: id, order_id, menu_item_id, item_name, quantity, price, special_instructions

### Redis (Queue Service) - Key-value store
- Queue entries stored with TTL
- Real-time position tracking

### SQLite (Payment Service) - `payments.db`
- **payments** table: id, payment_id, order_id, user_id, amount, status, payment_method, created_at

## API Conventions

### Authentication
- JWT tokens issued by User Service on login/register
- Protected endpoints require: `Authorization: Bearer <token>`
- Token contains: user_id, email, role

### Order Status Flow
```
PLACED → CONFIRMED → PREPARING → READY → COMPLETED
              ↓
         CANCELLED
```

### Role-Based Access
- **CUSTOMER**: Browse menu, place orders, track queue
- **STAFF**: Manage orders, update order status, view queue
- **ADMIN**: Full access including menu management, user management

## Code Style Notes

### Java (User Service)
- Spring Boot 3.2.0, Java 17
- JWT authentication with custom filters
- JPA entities with validation annotations
- SecurityConfig for CORS and authentication

### Node.js (Menu Service)
- Express 5.1.0, CommonJS modules
- Mongoose for MongoDB ODM
- Async/await for database operations

### Python (Order/Payment Services)
- Django 5.2.7 with Django REST Framework
- Flask 3.1.2 for lightweight payment service
- Pika 1.3.2 for RabbitMQ integration
- Type hints recommended but not enforced

### Go (Queue Service)
- Gin framework for HTTP routing
- go-redis for Redis operations
- gorilla/websocket for real-time updates
- Structured error handling with proper HTTP status codes

### TypeScript (Frontend)
- Next.js 15 App Router
- React 19 with functional components
- Zustand for state management
- Radix UI + Tailwind CSS for components
- Axios for API calls with interceptors

## Important Gotchas

1. **Database Initialization**: Services may crash on first run if databases aren't ready. The `wait-for-db.py` script in Order Service handles this, but manual waits may be needed in Docker Compose.

2. **RabbitMQ Vhost**: Default vhost is `/canteen`. Connection strings must include this: `amqp://admin:admin123@rabbitmq:5672/canteen`

3. **CORS**: All backend services have CORS enabled for `http://localhost:3000`. Update for production domains.

4. **WebSocket Connection**: Frontend connects to Queue Service WebSocket at `ws://localhost:8084/ws`. Must handle reconnection on connection loss.

5. **Service Dependencies**: Order Service requires Menu Service to validate items. Payment Service callbacks to Order Service. Plan startup order accordingly.

6. **Image Building**: Use `docker buildx build --platform linux/amd64` for GKE deployment from ARM Macs. The `build-and-push.sh` script handles this.

7. **JWT Secret**: Default secret is `your-secret-key-change-in-production`. MUST change for production deployments.

8. **Database Migrations**: Django migrations must run before Order Service starts. Spring Boot auto-creates PostgreSQL schema. Menu Service creates MongoDB collections automatically.

## CI/CD Pipeline

GitHub Actions workflows in `.github/workflows/`:
- **ci-cd.yml**: Main deployment pipeline (build → test → push → deploy)
- **infrastructure.yml**: Terraform validation
- **pr-validation.yml**: PR checks
- **security-scan.yml**: Dependency scanning

On push to `main`: Automated build, test, and GKE deployment if GitHub Secrets configured.

## Troubleshooting

**Service won't start:**
- Check database connectivity and credentials
- Verify RabbitMQ is running (for Order/Queue/Payment services)
- Check port conflicts

**RabbitMQ connection failures:**
- Ensure vhost `/canteen` exists: `rabbitmqadmin declare vhost name=/canteen`
- Check credentials: admin/admin123

**Frontend API calls failing:**
- Verify backend services are running and accessible
- Check CORS configuration
- Inspect browser console for errors

**WebSocket disconnections:**
- Queue Service may restart, causing temporary disconnections
- Frontend should auto-reconnect (implemented in queue context)

**GKE deployment issues:**
- Ensure images are pushed to GCR with correct project ID
- Verify Kubernetes manifests have correct image references
- Check pod logs: `kubectl logs <pod-name> -n canteen-system`
