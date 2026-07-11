from rest_framework import serializers
from .models import *

class CustomersSerializer(serializers.ModelSerializer):
	class Meta:
		model = Customers
		fields = '__all__'

class IpsupsSerializer(serializers.ModelSerializer):
	class Meta:
		model = Ipsups
		fields = '__all__'

class PoolsSerializer(serializers.ModelSerializer):
	class Meta:
		model = Customers
		fields = '__all__'

class HbsSerializer(serializers.ModelSerializer):
	class Meta:
		model = Hbs
		fields = '__all__'