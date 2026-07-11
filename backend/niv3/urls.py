from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'customers', CustomersViewSet)
router.register(r'ipsups', IpsupsViewSet)
router.register(r'pools', PoolsViewSet)
router.register(r'hbs', HbsViewSet)

urlpatterns = [
	path('', include(router.urls)),
]
