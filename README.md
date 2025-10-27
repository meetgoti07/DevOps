# Canteen Queue Manager

**Team Members:** Meet Goti (22BCE100), Priyanshi Kantariya (22BCE141)

**Semester:** 7th

**Course:** MAP

---

## Project Overview

The **Canteen Queue Manager** is a comprehensive microservice-based application designed to streamline canteen operations by eliminating traditional queuing systems. This project demonstrates the implementation of modern microservice architecture patterns, inter-service communication, and real-time features in a practical, real-world scenario.

### Problem Statement

Traditional canteen systems suffer from:

- Long physical queues leading to time wastage
- Manual order management causing inefficiencies
- Lack of real-time order tracking
- Poor customer experience and satisfaction
- Difficulty in managing peak hour rush

### Solution

A digital queue management system that allows:

- **Pre-ordering** from anywhere on campus
- **Real-time queue tracking** with position updates
- **Smart order management** for staff
- **Automated notifications** when orders are ready
- **Role-based access control** for different user types

---

## Microservice Architecture

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Load Balancer  │
│   (Next.js)     │◄───┤   (Nginx)      │◄───┤   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                         │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  User Service   │  Menu Service   │ Order Service   │ Queue Service   │Payment Service  │
│   (Spring)      │   (Node.js)     │   (Django)      │     (Go)        │    (Flask)      │
│   Port: 8081    │   Port: 8082    │   Port: 8083    │   Port: 8084    │   Port: 8085    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
         │                 │                 │                 │                 │
         │                 │                 ▼                 ▼                 ▼
         │                 │        ┌─────────────────────────────────────────────────┐
         │                 │        │            RabbitMQ Message Broker             │
         │                 │        │         (Asynchronous Communication)          │
         │                 │        │             Port: 5672, UI: 15672              │
         │                 │        └─────────────────────────────────────────────────┘
         ▼                 ▼                 ▼                 ▼                 ▼
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   PostgreSQL    │    MongoDB      │      MySQL      │     Redis       │    SQLite       │
│   (Users)       │   (Menu)        │   (Orders)      │   (Queue)       │  (Payments)     │
│   Port: 5432    │   Port: 27017   │   Port: 3306    │   Port: 6379    │    (File)       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │  Load Balancer  │
│   (Next.js)     │◄───┤   (Nginx)      │◄───┤   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                         │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│  User Service   │  Menu Service   │ Order Service   │ Queue Service   │Payment Service  │
│   (Spring)      │   (Node.js)     │   (Django)      │     (Go)        │    (Flask)      │
│   Port: 8081    │   Port: 8082    │   Port: 8083    │   Port: 8084    │   Port: 8085    │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
         │                 │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼                 ▼
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   PostgreSQL    │    MongoDB      │      MySQL      │     Redis       │    SQLite       │
│   (Users)       │   (Menu)        │   (Orders)      │   (Queue)       │  (Payments)     │
│   Port: 5432    │   Port: 27017   │   Port: 3306    │   Port: 6379    │    (File)       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Service Distribution Strategy

Each microservice uses different technologies to demonstrate **polyglot architecture**:

| Service             | Technology           | Database   | Purpose                         | Communication                   |
| ------------------- | -------------------- | ---------- | ------------------------------- | ------------------------------- |
| **User Service**    | Java Spring Boot     | PostgreSQL | Authentication, User Management | REST APIs                       |
| **Menu Service**    | Node.js + Express    | MongoDB    | Menu Items, Categories          | REST APIs                       |
| **Order Service**   | Python Django        | MySQL      | Order Processing, Management    | **REST + RabbitMQ**             |
| **Queue Service**   | Go + Gin             | Redis      | Real-time Queue Management      | **REST + RabbitMQ + WebSocket** |
| **Payment Service** | Python Flask         | SQLite     | Payment Processing              | **REST + RabbitMQ**             |
| **Message Broker**  | RabbitMQ             | -          | Asynchronous Communication      | **AMQP**                        |
| **Frontend**        | Next.js + TypeScript | -          | User Interface                  | REST APIs + WebSocket           |

---

## Core Functionalities

### 1. **User Management & Authentication**

- **Registration/Login System** with JWT-based authentication
- **Role-based Access Control:**
  - **CUSTOMER:** Browse menu, place orders, track queue
  - **STAFF:** Manage orders, update order status
  - **ADMIN:** Full system control, user management, analytics
- **Profile Management** with secure password handling
- **Session Management** with automatic token refresh

### 2. **Menu Management System**

- **Dynamic Menu Display** with categories and items
- **Real-time Availability** tracking
- **Price Management** with preparation time estimates
- **Image Support** for menu items
- **Category-wise Organization** for better UX
- **Admin Controls** for menu modifications

### 3. **Order Processing Pipeline**

- **Shopping Cart Functionality** with item customization
- **Order Placement** with special instructions
- **Order Validation** against menu availability
- **Multi-step Order States:**
  ```
  PLACED → CONFIRMED → PREPARING → READY → COMPLETED
  ```
- **Order History** and tracking
- **Bulk Order Management** for staff

### 4. **Intelligent Queue Management**

- **Automatic Queue Assignment** upon order placement
- **Real-time Position Tracking** for customers
- **Estimated Wait Times** based on preparation complexity
- **Priority Queue Algorithm** for special cases
- **Queue Statistics** and analytics
- **Staff Queue Management Tools**

### 5. **Payment Integration**

- **Mock Payment Gateway** simulation
- **Multiple Payment Methods** support
- **Payment Status Tracking**
- **Automatic Order Confirmation** after payment
- **Payment History** and receipts
- **Refund Processing** capabilities

### 6. **Real-time Features**

- **WebSocket Integration** for live updates
- **Queue Position Updates** without page refresh
- **Order Status Notifications**
- **Sound Notifications** for order ready alerts
- **Live Dashboard** for staff operations
- **Real-time Analytics** for admin

---

## 🔄 Asynchronous Communication Architecture

### **RabbitMQ Message Broker Integration**

The system has been enhanced with **RabbitMQ** for asynchronous communication, demonstrating advanced microservice patterns beyond simple REST APIs.

#### **Message Broker Setup**

- **RabbitMQ 3.12** with management interface
- **Topic Exchange:** `canteen.orders` for routing flexibility
- **Durable Queues** for message persistence
- **Message Acknowledgments** for reliability
- **Dead Letter Queues** for error handling

#### **Async Communication Flow**

```mermaid
graph TB
    subgraph "Order Service (Publisher)"
        OS[Order Service] --> |Publish Events| RMQ
    end

    subgraph "RabbitMQ Message Broker"
        RMQ[Exchange: canteen.orders<br/>Type: Topic]
        RMQ --> |order.created| Q1[Queue: queue.service.orders]
        RMQ --> |payment.initiated| Q2[Queue: payment.service.queue]
        RMQ --> |order.confirmed| Q1
        RMQ --> |payment.success| Q3[Queue: order.service.payments]
    end

    subgraph "Consumers"
        Q1 --> QS[Queue Service]
        Q2 --> PS[Payment Service]
        Q3 --> OS2[Order Service]
    end
```

#### **Event Types and Routing Keys**

| Event Type            | Routing Key         | Publisher       | Consumer(s)     | Purpose                    |
| --------------------- | ------------------- | --------------- | --------------- | -------------------------- |
| **Order Created**     | `order.created`     | Order Service   | -               | Event logging              |
| **Payment Initiated** | `payment.initiated` | Order Service   | Payment Service | Trigger payment processing |
| **Payment Success**   | `payment.success`   | Payment Service | Order Service   | Confirm order payment      |
| **Payment Failed**    | `payment.failed`    | Payment Service | Order Service   | Handle payment failure     |
| **Order Confirmed**   | `order.confirmed`   | Order Service   | Queue Service   | Add to preparation queue   |
| **Order Preparing**   | `order.preparing`   | Order Service   | Queue Service   | Update queue status        |
| **Order Ready**       | `order.ready`       | Order Service   | Queue Service   | Notify customer            |
| **Order Completed**   | `order.completed`   | Order Service   | Queue Service   | Remove from queue          |
| **Order Cancelled**   | `order.cancelled`   | Order Service   | Queue Service   | Remove from queue          |

#### **Message Payload Structure**

```json
{
  "event_type": "order_confirmed",
  "order_id": 123,
  "user_id": 45,
  "old_status": "placed",
  "new_status": "confirmed",
  "total_amount": 25.5,
  "queue_number": 15,
  "timestamp": "2025-10-10T10:00:00Z",
  "items": [
    {
      "menu_item_id": "507f1f77bcf86cd799439013",
      "item_name": "Coffee",
      "quantity": 2,
      "price": 2.5,
      "special_instructions": "Extra sugar"
    }
  ]
}
```

#### **Benefits of Async Architecture**

1. **Decoupling:** Services don't need to be online simultaneously
2. **Resilience:** Failed messages can be retried automatically
3. **Scalability:** Handle high loads with message queuing
4. **Reliability:** Persistent messages survive service restarts
5. **Flexibility:** Easy to add new consumers for events
6. **Performance:** Non-blocking operations improve response times

#### **Fallback Mechanisms**

The system maintains **backward compatibility** with HTTP-based communication:

```python
# Payment Service - Hybrid Communication
try:
    # Try async messaging first
    rabbitmq = get_rabbitmq_service()
    if rabbitmq:
        rabbitmq.publish_payment_result(order_id, status, payment_id)
    else:
        # Fallback to HTTP notification
        self._notify_order_service(order_id, payment_id, status)
except Exception:
    # Fallback to HTTP notification
    self._notify_order_service(order_id, payment_id, status)
```

---

## 🔧 Technical Implementation

### **Frontend Architecture (Next.js)**

```typescript
├── app/                    # App Router structure
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Protected main routes
│   │   ├── admin/         # Admin dashboard
│   │   ├── staff/         # Staff dashboard
│   │   ├── menu/          # Menu browsing
│   │   ├── cart/          # Shopping cart
│   │   ├── orders/        # Order tracking
│   │   └── queue/         # Queue display
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── menu/             # Menu-related components
│   ├── order/            # Order management
│   ├── queue/            # Queue display & controls
│   └── ui/               # Base UI components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
└── lib/                  # Utility libraries
    ├── api.ts            # API service instances
    ├── auth.ts           # Authentication logic
    ├── types.ts          # TypeScript definitions
    └── store.ts          # State management
```

### **Microservice Communication Patterns**

#### 1. **Synchronous Communication (REST APIs)**

- **HTTP/HTTPS** for request-response patterns
- **Service Discovery** through environment configuration
- **Load Balancing** ready architecture
- **Error Handling** with retry mechanisms

#### 2. **Asynchronous Communication (Message Queue)**

- **RabbitMQ** for event-driven architecture
- **Message Publishing** from Order Service for order events
- **Message Consumption** in Queue and Payment Services
- **Event Sourcing** for order state changes
- **Resilient Processing** with message acknowledgments

#### 3. **Real-time Communication (WebSocket)**

- **WebSocket** for real-time queue updates
- **Event Broadcasting** for staff notifications

#### 4. **Inter-service Data Flow with Async Events**

```mermaid
sequenceDiagram
    participant U as User Service
    participant M as Menu Service
    participant O as Order Service
    participant Q as Queue Service
    participant P as Payment Service
    participant R as RabbitMQ

    Note over U,R: Async Order Placement Flow
    U->>M: Validate menu items (REST)
    M->>U: Return item details
    U->>O: Create order (REST)
    O->>R: Publish order.created event
    O->>R: Publish payment.initiated event
    R->>P: Consume payment.initiated
    P->>P: Process payment
    P->>R: Publish payment.success event
    R->>O: Consume payment.success
    O->>O: Update status to 'confirmed'
    O->>R: Publish order.confirmed event
    R->>Q: Consume order.confirmed
    Q->>Q: Add to queue
    Q-->>U: WebSocket notification
```

### **Database Design Philosophy**

#### **Polyglot Persistence Strategy**

Each service uses the most appropriate database technology:

1. **PostgreSQL (User Service)**

   - **ACID Compliance** for user data integrity
   - **Complex Relationships** for user roles and permissions
   - **Strong Consistency** for authentication data

2. **MongoDB (Menu Service)**

   - **Document-based** storage for menu items
   - **Flexible Schema** for dynamic menu attributes
   - **Fast Read Operations** for menu browsing

3. **MySQL (Order Service)**

   - **Relational Structure** for order-item relationships
   - **Transaction Support** for order processing
   - **Referential Integrity** for data consistency

4. **Redis (Queue Service)**

   - **In-memory Storage** for lightning-fast queue operations
   - **Pub/Sub Capabilities** for real-time updates
   - **Automatic Expiration** for queue cleanup

5. **SQLite (Payment Service)**
   - **Lightweight** for payment transaction logs
   - **ACID Transactions** for payment integrity
   - **Embedded Database** for simplified deployment

---

## Security Implementation

### **Authentication & Authorization**

- **JWT (JSON Web Tokens)** for stateless authentication
- **Password Hashing** using BCrypt
- **Role-Based Access Control (RBAC)**
- **CORS Configuration** for cross-origin requests
- **Request Validation** and sanitization

### **API Security**

- **Bearer Token Authentication** for protected endpoints
- **Input Validation** at service boundaries
- **Rate Limiting** preparedness
- **Error Handling** without information leakage

### **Data Protection**

- **Environment Variables** for sensitive configuration
- **Database Connection Security**
- **API Key Management** for external services

---

## DevOps & Deployment

### **Containerization Strategy**

Each service includes a **Dockerfile** for containerization:

```dockerfile
# Example: User Service Dockerfile
FROM openjdk:17-jdk-slim
COPY target/user-service-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### **Docker Compose Orchestration**

- **Multi-container Setup** with service dependencies
- **Environment Configuration** management
- **Network Isolation** between services
- **Volume Management** for data persistence
- **Health Checks** for service monitoring

### **Service Discovery & Configuration**

- **Environment-based Configuration**
- **Service URL Management**
- **Database Connection Pooling**
- **Graceful Shutdown** handling

---

## Real-time Features & WebSocket Implementation

### **Queue Service WebSocket Server (Go)**

```go
type WebSocketHub struct {
    clients    map[*Client]bool
    broadcast  chan WebSocketMessage
    register   chan *Client
    unregister chan *Client
}

// Broadcasts real-time updates to all connected clients
func (h *WebSocketHub) Broadcast(message WebSocketMessage) {
    h.broadcast <- message
}
```

### **Frontend WebSocket Integration**

- **Automatic Reconnection** on connection loss
- **Message Type Handling** for different update types
- **Queue Position Updates** without polling
- **Order Status Notifications** in real-time
- **Sound Notifications** for order ready alerts

### **Real-time Update Types**

1. **Queue Updates:** Position changes, new orders
2. **Status Updates:** Order preparation status changes
3. **Queue Removal:** Order completion notifications
4. **System Alerts:** Maintenance or important notifications

---

## 🚀 Deployment & Installation

### **Production Deployment (Google Cloud Platform)**

This project is production-ready and can be deployed to GCP with automated CI/CD. See complete guides:

- 📖 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete end-to-end deployment guide
- 🚀 **[QUICK_START.md](QUICK_START.md)** - Quick 5-step deployment
- ✅ **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Track your progress

**Quick Deploy:**

```bash
# 1. Initial GCP Setup (automated)
./setup-gcp.sh

# 2. Deploy Infrastructure
cd terraform && terraform apply

# 3. Build & Push Images
./build-and-push.sh YOUR_PROJECT_ID

# 4. Deploy to Kubernetes
cd kubernetes && kubectl apply -f .

# 5. Get your application URL
kubectl get service api-gateway -n canteen-system
```

**Automated CI/CD:** Every push to `main` automatically deploys to GCP! 🎉

---

### **Local Development Setup**

#### **Prerequisites**

- **Docker & Docker Compose**
- **Node.js 18+** (for frontend development)
- **Java 17+** (for user service development)
- **Python 3.9+** (for order/payment services)
- **Go 1.19+** (for queue service development)

#### **Quick Start with Docker**

```bash
# Clone the repository
git clone <repository-url>
cd canteen-queue-manager

# Start all services with Docker Compose (including RabbitMQ)
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# User Service: http://localhost:8081
# Menu Service: http://localhost:8082
# Order Service: http://localhost:8083
# Queue Service: http://localhost:8084
# Payment Service: http://localhost:8085
# RabbitMQ Management UI: http://localhost:15672 (admin/admin123)
```

### **Individual Service Setup**

#### **Frontend Service**

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

#### **User Service (Java Spring Boot)**

```bash
cd user-service
./mvnw spring-boot:run
# Runs on http://localhost:8081
```

#### **Menu Service (Node.js)**

```bash
cd menu-service
npm install
npm start
# Runs on http://localhost:8082
```

#### **Order Service (Django)**

```bash
cd order-service
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8083
# Runs on http://localhost:8083
```

#### **Queue Service (Go)**

```bash
cd queue-service
go mod download
go run main.go
# Runs on http://localhost:8084
```

#### **Payment Service (Flask)**

```bash
cd payment-service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:8085
```

---

## API Documentation

### **User Service (Port: 8081)**

**Base URL:** `http://localhost:8081`

#### **Authentication Endpoints**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}

Response: 201 Created
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "Bearer",
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "CUSTOMER"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "Bearer",
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "CUSTOMER"
}
```

```http
GET /api/auth/profile
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "CUSTOMER",
  "phone": "+1234567890"
}
```

```http
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Smith",
  "phone": "+1987654321"
}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "John Smith",
  "role": "CUSTOMER",
  "phone": "+1987654321"
}
```

#### **Health Check**

```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "service": "User Service",
  "timestamp": "2025-10-10T10:00:00Z"
}
```

---

### **Menu Service (Port: 8082)**

**Base URL:** `http://localhost:8082`

#### **Category Endpoints**

```http
GET /api/menu/categories

Response: 200 OK
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Beverages",
    "display_order": 1,
    "active": true,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
]
```

```http
POST /api/menu/categories
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Main Course",
  "display_order": 2,
  "active": true
}

Response: 201 Created
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Main Course",
  "display_order": 2,
  "active": true,
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:00Z"
}
```

```http
PUT /api/menu/categories/{categoryId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Category",
  "active": false
}

Response: 200 OK
```

```http
DELETE /api/menu/categories/{categoryId}
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Category deleted successfully"
}
```

#### **Menu Item Endpoints**

```http
GET /api/menu/items

Response: 200 OK
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Coffee",
    "description": "Freshly brewed coffee",
    "category": "507f1f77bcf86cd799439011",
    "price": 2.50,
    "available": true,
    "image_url": "https://example.com/coffee.jpg",
    "preparation_time": 5,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
]
```

```http
GET /api/menu/items/category/{categoryId}

Response: 200 OK
[/* Items in specific category */]
```

```http
GET /api/menu/items/{itemId}

Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439013",
  "name": "Coffee",
  "description": "Freshly brewed coffee",
  "category": "507f1f77bcf86cd799439011",
  "price": 2.50,
  "available": true,
  "image_url": "https://example.com/coffee.jpg",
  "preparation_time": 5,
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:00Z"
}
```

```http
POST /api/menu/items
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Tea",
  "description": "Premium tea selection",
  "category": "507f1f77bcf86cd799439011",
  "price": 2.00,
  "available": true,
  "preparation_time": 3
}

Response: 201 Created
```

```http
PUT /api/menu/items/{itemId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Item",
  "price": 3.00,
  "available": false
}

Response: 200 OK
```

```http
DELETE /api/menu/items/{itemId}
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "message": "Menu item deleted successfully"
}
```

#### **Health Check**

```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "service": "Menu Service",
  "timestamp": "2025-10-10T10:00:00Z"
}
```

---

### **Order Service (Port: 8083)**

**Base URL:** `http://localhost:8083`

#### **Order Management Endpoints**

```http
POST /api/orders/
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_id": 1,
  "items": [
    {
      "menu_item_id": "507f1f77bcf86cd799439013",
      "quantity": 2,
      "special_instructions": "Extra sugar"
    }
  ],
  "special_instructions": "Handle with care"
}

Response: 201 Created
{
  "id": 1,
  "user_id": 1,
  "items": [
    {
      "id": 1,
      "menu_item_id": "507f1f77bcf86cd799439013",
      "item_name": "Coffee",
      "quantity": 2,
      "price": 2.50,
      "total_price": 5.00,
      "special_instructions": "Extra sugar"
    }
  ],
  "total_amount": 5.00,
  "status": "placed",
  "special_instructions": "Handle with care",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:00Z"
}
```

```http
GET /api/orders/user/{userId}
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "user_id": 1,
    "items": [...],
    "total_amount": 5.00,
    "status": "placed",
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
]
```

```http
GET /api/orders/user/{userId}/active
Authorization: Bearer {token}

Response: 200 OK
[/* Active orders only */]
```

```http
GET /api/orders/{orderId}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "user_id": 1,
  "items": [...],
  "total_amount": 5.00,
  "status": "placed",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:00Z"
}
```

```http
PUT /api/orders/{orderId}/status
Authorization: Bearer {staff_token}
Content-Type: application/json

{
  "status": "preparing"
}

Response: 200 OK
{
  "id": 1,
  "status": "preparing",
  "updated_at": "2025-10-10T10:05:00Z"
}
```

```http
GET /api/orders/
Authorization: Bearer {staff_token}

Response: 200 OK
[/* All orders for staff management */]
```

```http
DELETE /api/orders/{orderId}
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Order cancelled successfully"
}
```

#### **Health Check**

```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "service": "Order Service",
  "timestamp": "2025-10-10T10:00:00Z"
}
```

---

### **Queue Service (Port: 8084)**

**Base URL:** `http://localhost:8084`

#### **Queue Management Endpoints**

```http
POST /api/queue/
Content-Type: application/json

{
  "order_id": 1,
  "user_id": 1
}

Response: 201 Created
{
  "order_id": 1,
  "user_id": 1,
  "queue_number": 15,
  "estimated_wait_time": 25,
  "status": "waiting",
  "created_at": "2025-10-10T10:00:00Z"
}
```

```http
GET /api/queue/order/{orderId}

Response: 200 OK
{
  "order_id": 1,
  "user_id": 1,
  "queue_number": 15,
  "estimated_wait_time": 20,
  "status": "waiting",
  "created_at": "2025-10-10T10:00:00Z"
}
```

```http
GET /api/queue/active

Response: 200 OK
[
  {
    "order_id": 1,
    "user_id": 1,
    "queue_number": 15,
    "estimated_wait_time": 20,
    "status": "waiting",
    "created_at": "2025-10-10T10:00:00Z"
  },
  {
    "order_id": 2,
    "user_id": 2,
    "queue_number": 16,
    "estimated_wait_time": 30,
    "status": "preparing",
    "created_at": "2025-10-10T10:02:00Z"
  }
]
```

```http
PUT /api/queue/order/{orderId}
Content-Type: application/json

{
  "status": "preparing"
}

Response: 200 OK
{
  "order_id": 1,
  "user_id": 1,
  "queue_number": 15,
  "estimated_wait_time": 15,
  "status": "preparing",
  "created_at": "2025-10-10T10:00:00Z"
}
```

```http
DELETE /api/queue/order/{orderId}

Response: 200 OK
{
  "message": "Order removed from queue successfully"
}
```

```http
GET /api/queue/stats

Response: 200 OK
{
  "total_orders_today": 50,
  "average_wait_time": 18.5,
  "active_orders_count": 8
}
```

#### **WebSocket Connection**

```http
GET /ws
Upgrade: websocket
Connection: Upgrade

WebSocket Messages:
{
  "type": "queue_update",
  "data": {
    "order_id": 1,
    "status": "preparing",
    "estimated_wait_time": 10
  }
}

{
  "type": "status_update",
  "data": {
    "order_id": 1,
    "status": "ready"
  }
}

{
  "type": "queue_removed",
  "data": {
    "order_id": 1
  }
}
```

#### **Health Check**

```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "service": "Queue Service",
  "timestamp": "2025-10-10T10:00:00Z"
}
```

---

### **Payment Service (Port: 8085)**

**Base URL:** `http://localhost:8085`

#### **Payment Processing Endpoints**

```http
POST /api/payments/
Content-Type: application/json

{
  "order_id": 1,
  "user_id": 1,
  "amount": 5.00,
  "payment_method": "mock"
}

Response: 201 Created
{
  "id": 1,
  "payment_id": "pay_1234567890",
  "order_id": 1,
  "user_id": 1,
  "amount": 5.00,
  "status": "pending",
  "payment_method": "mock",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:00Z"
}
```

```http
POST /api/payments/{paymentId}/process

Response: 200 OK
{
  "id": 1,
  "payment_id": "pay_1234567890",
  "order_id": 1,
  "user_id": 1,
  "amount": 5.00,
  "status": "success",
  "payment_method": "mock",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:30Z"
}
```

```http
GET /api/payments/{paymentId}

Response: 200 OK
{
  "id": 1,
  "payment_id": "pay_1234567890",
  "order_id": 1,
  "user_id": 1,
  "amount": 5.00,
  "status": "success",
  "payment_method": "mock",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:30Z"
}
```

```http
PUT /api/payments/{paymentId}/status
Content-Type: application/json

{
  "status": "failed"
}

Response: 200 OK
{
  "id": 1,
  "payment_id": "pay_1234567890",
  "status": "failed",
  "updated_at": "2025-10-10T10:01:00Z"
}
```

```http
GET /api/payments/order/{orderId}

Response: 200 OK
{
  "id": 1,
  "payment_id": "pay_1234567890",
  "order_id": 1,
  "user_id": 1,
  "amount": 5.00,
  "status": "success",
  "payment_method": "mock",
  "created_at": "2025-10-10T10:00:00Z",
  "updated_at": "2025-10-10T10:00:30Z"
}
```

```http
GET /api/payments/stats

Response: 200 OK
{
  "total_payments": 100,
  "successful_payments": 95,
  "failed_payments": 3,
  "pending_payments": 2,
  "total_revenue": 2500.00,
  "average_payment": 25.00
}
```

#### **Health Check**

```http
GET /health

Response: 200 OK
{
  "status": "OK",
  "service": "Payment Service",
  "timestamp": "2025-10-10T10:00:00Z"
}
```

---

### **Common HTTP Status Codes**

| Status Code                 | Description                    | Usage                   |
| --------------------------- | ------------------------------ | ----------------------- |
| `200 OK`                    | Successful GET/PUT requests    | Data retrieval, updates |
| `201 Created`               | Successful POST requests       | Resource creation       |
| `400 Bad Request`           | Invalid request data           | Validation errors       |
| `401 Unauthorized`          | Missing/invalid authentication | Auth required           |
| `403 Forbidden`             | Insufficient permissions       | Role-based access       |
| `404 Not Found`             | Resource not found             | Invalid IDs             |
| `500 Internal Server Error` | Server-side errors             | System failures         |

---

### **Authentication Headers**

All protected endpoints require the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Content-Type Headers**

For POST/PUT requests with JSON data:

```http
Content-Type: application/json
```

### **CORS Support**

All services are configured with CORS to allow:

- **Origins:** `*` (all origins)
- **Methods:** `GET, POST, PUT, DELETE, OPTIONS`
- **Headers:** `Content-Type, Authorization, X-Requested-With`
- **Credentials:** Supported

---

## Monitoring & Observability

### **Health Check Endpoints**

Each service provides health monitoring:

```
GET /health
```

Returns service status, database connectivity, and dependencies.

### **Logging Strategy**

- **Structured Logging** with consistent format
- **Request/Response** logging for debugging
- **Error Tracking** with stack traces
- **Performance Metrics** collection

### **Metrics Collection**

- **Response Time** monitoring
- **Error Rate** tracking
- **Queue Performance** metrics
- **Database Query** performance

---

## Development Guidelines

### **Code Standards**

- **Clean Code** principles
- **SOLID** design principles
- **DRY (Don't Repeat Yourself)** principle
- **Consistent Naming** conventions
- **Comprehensive Documentation**

### **API Design Principles**

- **RESTful** endpoint design
- **Consistent Response** formats
- **Proper HTTP Status** codes
- **API Versioning** strategy
- **Comprehensive Error** messages

---

## Learning Outcomes

### **Microservice Architecture Concepts**

1. **Service Decomposition** strategies
2. **Database per Service** pattern
3. **API Gateway** pattern understanding
4. **Service Discovery** mechanisms
5. **Distributed Data Management**

### **Technology Integration**

1. **Polyglot Programming** experience
2. **Container Orchestration** with Docker
3. **Real-time Communication** with WebSockets
4. **State Management** in distributed systems
5. **Security** in microservice environments

---

## 🏆 Project Achievements

### **Technical Milestones**

- ✅ **5 Independent Microservices** with different tech stacks
- ✅ **Real-time Communication** via WebSockets
- ✅ **Comprehensive Authentication** system
- ✅ **Database Polyglot** persistence
- ✅ **Containerized Deployment** ready
- ✅ **Responsive Frontend** with modern UX
- ✅ **Role-based Access Control**
- ✅ **Payment Processing** simulation

### **Business Logic Implementation**

- ✅ **Complete Order Lifecycle** management
- ✅ **Intelligent Queue Management**
- ✅ **Multi-role User System**
- ✅ **Real-time Notifications**
- ✅ **Staff Operations Dashboard**

---
