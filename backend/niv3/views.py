from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *

# Create your views here.

class CustomersViewSet(viewsets.ModelViewSet):
	queryset = Customers.objects.all()
	serializer_class = CustomersSerializer
	#persmission_classes = [IsAuthenticated]

class IpsupsViewSet(viewsets.ModelViewSet):
	queryset = Ipsups.objects.all()
	serializer_class = IpsupsSerializer

class PoolsViewSet(viewsets.ModelViewSet):
	queryset = Pools.objects.all()
	serializer_class = PoolsSerializer

class HbsViewSet(viewsets.ModelViewSet):
	queryset = Hbs.objects.all()
	serializer_class = HbsSerializer