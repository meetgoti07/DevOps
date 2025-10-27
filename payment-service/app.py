from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import threading
from config import Config
from services import PaymentService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
app.url_map.strict_slashes = False  # Allow both `/path` and `/path/`

# Enable CORS
CORS(app, origins='*', 
     supports_credentials=True, 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'])

# Initialize payment service
payment_service = PaymentService(Config.DATABASE_PATH, Config.ORDER_SERVICE_URL)

# Initialize RabbitMQ if available
rabbitmq_service = None
try:
    from message_broker import get_rabbitmq_service
    rabbitmq_service = get_rabbitmq_service(Config.RABBITMQ_URL)
    
    if rabbitmq_service:
        # Set up consumer in a separate thread
        def start_rabbitmq_consumer():
            try:
                rabbitmq_service.setup_consumer(payment_service)
                rabbitmq_service.start_consuming()
            except Exception as e:
                logger.error(f"RabbitMQ consumer error: {str(e)}")
        
        consumer_thread = threading.Thread(target=start_rabbitmq_consumer, daemon=True)
        consumer_thread.start()
        logger.info("RabbitMQ consumer started")
    
except ImportError:
    logger.info("RabbitMQ not available, running in HTTP-only mode")
except Exception as e:
    logger.error(f"Failed to initialize RabbitMQ: {str(e)}")
    logger.info("Continuing without RabbitMQ")

@app.route('/api/payments/', methods=['POST'])
def initiate_payment():
    """Initiate a new payment"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['order_id', 'user_id', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        order_id = data['order_id']
        user_id = data['user_id']
        amount = data['amount']
        payment_method = data.get('payment_method', 'mock')
        
        # Validate amount
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        # Initiate payment
        payment = payment_service.initiate_payment(order_id, user_id, amount, payment_method)
        
        # Process mock payment in background
        if payment_method == 'mock':
            threading.Thread(
                target=payment_service.process_mock_payment,
                args=(payment.payment_id,)
            ).start()
        
        return jsonify(payment.to_dict()), 201
        
    except Exception as e:
        logger.error(f"Error initiating payment: {str(e)}")
        return jsonify({'error': 'Failed to initiate payment'}), 500

@app.route('/api/payments/<payment_id>/process', methods=['POST'])
def process_payment(payment_id):
    """Process a payment (for mock payments)"""
    try:
        payment = payment_service.process_mock_payment(payment_id)
        return jsonify(payment.to_dict()), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error processing payment {payment_id}: {str(e)}")
        return jsonify({'error': 'Failed to process payment'}), 500

@app.route('/api/payments/<payment_id>', methods=['GET'])
def get_payment(payment_id):
    """Get payment by payment ID"""
    try:
        payment = payment_service.get_payment(payment_id)
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error getting payment {payment_id}: {str(e)}")
        return jsonify({'error': 'Failed to get payment'}), 500

@app.route('/api/payments/<payment_id>/status', methods=['PUT'])
def update_payment_status(payment_id):
    """Update payment status"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'error': 'Status is required'}), 400
        
        status = data['status']
        valid_statuses = ['pending', 'success', 'failed', 'cancelled']
        
        if status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        payment = payment_service.update_payment_status(payment_id, status)
        
        return jsonify(payment.to_dict()), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error updating payment status: {str(e)}")
        return jsonify({'error': 'Failed to update payment status'}), 500

@app.route('/api/payments/order/<int:order_id>', methods=['GET'])
def get_payment_by_order(order_id):
    """Get payment by order ID"""
    try:
        payment = payment_service.get_payment_by_order(order_id)
        
        if not payment:
            return jsonify({'error': 'Payment not found for this order'}), 404
        
        return jsonify(payment.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error getting payment for order {order_id}: {str(e)}")
        return jsonify({'error': 'Failed to get payment'}), 500

@app.route('/api/payments/stats', methods=['GET'])
def get_payment_stats():
    """Get payment statistics"""
    try:
        stats = payment_service.get_payment_stats()
        return jsonify(stats), 200
        
    except Exception as e:
        logger.error(f"Error getting payment stats: {str(e)}")
        return jsonify({'error': 'Failed to get payment stats'}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'service': 'Payment Service',
        'timestamp': request.headers.get('Date', 'N/A')
    }), 200

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    logger.info(f"Payment Service starting on port {Config.PORT}")
    logger.info(f"Database path: {Config.DATABASE_PATH}")
    logger.info(f"Order Service URL: {Config.ORDER_SERVICE_URL}")
    
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
