from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_order, name='create_order'),
    path('<int:order_id>/', views.get_order, name='get_order'),
    path('user/<int:user_id>/', views.get_user_orders, name='get_user_orders'),
    path('user/<int:user_id>/active/', views.get_user_active_orders, name='get_user_active_orders'),
    path('<int:order_id>/status/', views.update_order_status, name='update_order_status'),
    path('health/', views.health_check, name='health_check'),
]