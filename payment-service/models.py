from datetime import datetime

class Payment:
    def __init__(self, payment_id, order_id, user_id, amount, status='pending', payment_method=None, created_at=None, updated_at=None, id=None):
        self.id = id
        self.payment_id = payment_id
        self.order_id = order_id
        self.user_id = user_id
        self.amount = amount
        self.status = status
        self.payment_method = payment_method
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def to_dict(self):
        return {
            'id': self.id,
            'payment_id': self.payment_id,
            'order_id': self.order_id,
            'user_id': self.user_id,
            'amount': self.amount,
            'status': self.status,
            'payment_method': self.payment_method,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            'updated_at': self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
        }
    
    @classmethod
    def from_db_row(cls, row):
        return cls(
            id=row['id'],
            payment_id=row['payment_id'],
            order_id=row['order_id'],
            user_id=row['user_id'],
            amount=row['amount'],
            status=row['status'],
            payment_method=row['payment_method'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )