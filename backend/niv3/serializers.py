# backend/serializers.py
#
# NOTE: adjust the `from .models import ...` line to match your actual
# app path (e.g. `from network.models import ...`) — the models.py you
# shared didn't include an app label, so this assumes it sits next to
# these serializers.

import re

from rest_framework import serializers
from .models import Customers, Pools, Ipsups, Hbs
from .validators import (
    validate_mac_format,
    validate_ipv4_strict,
    validate_mask_range,
    validate_wildcard,
)

# Matches \r\n, lone \r, or lone \n — anything that could show up as an
# embedded line break in a value copy-pasted from Excel/Word/a text file.
_LINEBREAK_RE = re.compile(r'\r\n|\r|\n')


class TrimmedModelSerializer(serializers.ModelSerializer):
    """
    Shared base class for every serializer below. Server-side backstop
    for the same cleanup already applied client-side (see
    src/utils/validators.js -> trimPayload): the frontend can't be
    trusted as the only line of defense, since this API can be called
    directly (Postman, a script, another client) and bypass it entirely.

    Before any field-level validation runs (validate_mac_format,
    validate_ipv4_strict, the *_srvnewident/*_customer_name/*_customer_ip
    duplicate checks, etc.), every string value in the incoming payload
    is cleaned:
      - leading whitespace stripped
      - trailing whitespace stripped
      - any embedded \\r, \\n, or \\r\\n collapsed to a plain space

    This has to happen by overriding `to_internal_value` (rather than in
    each `validate_<field>`), because DRF runs each field's own
    validators — including `validate_mac_format` / `validate_ipv4_strict`
    — during `to_internal_value` itself, before `validate_<field>` is
    ever called. Cleaning any later would let a stray space or line
    break reach those format validators first and fail them
    unnecessarily, or worse, let it slip into a UNIQUE comparison.
    """

    def to_internal_value(self, data):
        if isinstance(data, dict):
            cleaned = {}
            for key, value in data.items():
                if isinstance(value, str):
                    value = _LINEBREAK_RE.sub(' ', value).strip()
                cleaned[key] = value
            data = cleaned
        return super().to_internal_value(data)


class CustomersSerializer(TrimmedModelSerializer):
    # Uniqueness is already enforced at the DB level (unique=True on the
    # model), but DRF's default UniqueValidator error is generic ("this
    # field must be unique"). Overriding here gives the same friendly
    # wording the frontend shows, and fires before the DB round-trip.
    customer_name = serializers.CharField(
        validators=[], required=False, allow_blank=True, allow_null=True
    )
    srvnewident = serializers.CharField()
    customer_ip = serializers.CharField(validators=[validate_ipv4_strict])
    # customer_relais is a short relay code (e.g. "amp", "tsiroa"), not an
    # IP address — plain text, no format validator.
    customer_relais = serializers.CharField()
    customer_mac_dhcp = serializers.CharField(validators=[validate_mac_format])
    # Never trust a client-supplied ARP value — always derived server-side
    # from customer_mac_dhcp on create/update. Marked read-only so it's
    # simply ignored if a client sends one.
    customer_mac_arp = serializers.CharField(read_only=True)
    customer_mask = serializers.CharField()
    # customer_pool is never typed directly — it always mirrors
    # pools.pool_num for whichever pools row matches this customer's
    # pool_code (customers.pool_code = pools.pool_code). Read-only here
    # so a client-supplied value is ignored; see _apply_pool_automation.
    customer_pool = serializers.CharField(read_only=True)

    class Meta:
        model = Customers
        fields = '__all__'
        read_only_fields = ['id']

    def validate_srvnewident(self, value):
        qs = Customers.objects.filter(srvnewident__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This SRVnewIdent already exists')
        return value

    def validate_customer_name(self, value):
        if not value:
            return value
        qs = Customers.objects.filter(customer_name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This customer name already exists')
        return value

    def validate_customer_ip(self, value):
        qs = Customers.objects.filter(customer_ip=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This IP address already exists')
        # Cross-table check: the same value can't simultaneously be a
        # customer's assigned IP and an ipsups supervision network
        # address. Mirrors the client-side check in CustomerForm.jsx
        # (crossChecks against ipsups.ipsup_netw) — kept here too since
        # the API can be hit directly, bypassing the frontend entirely.
        if Ipsups.objects.filter(ipsup_netw=value).exists():
            raise serializers.ValidationError(
                'This IP address is already used as an IPSUP network (ipsups.ipsup_netw)'
            )
        return value

    def validate_customer_mask(self, value):
        validate_mask_range(value, 8, 32)
        return str(int(value)).zfill(2)

    def validate_pool_code(self, value):
        # customer_pool is derived from this lookup (see
        # _apply_pool_automation below), so pool_code has to resolve to a
        # real pools row — otherwise customer_pool would have nothing to
        # mirror and the NOT NULL column would be left unset.
        if not Pools.objects.filter(pool_code=value).exists():
            raise serializers.ValidationError(
                'No matching pool found for this pool_code (pools.pool_code)'
            )
        return value

    def _apply_mac_automation(self, validated_data):
        # customer_mac_arp always mirrors customer_mac_dhcp — this is the
        # one and only place it gets set.
        if 'customer_mac_dhcp' in validated_data:
            validated_data['customer_mac_arp'] = validated_data['customer_mac_dhcp']
        return validated_data

    def _apply_pool_automation(self, validated_data, instance=None):
        # customer_pool always mirrors pools.pool_num for whichever pools
        # row has pool_code == this customer's pool_code. Falls back to
        # the instance's existing pool_code on a partial PATCH that
        # doesn't touch pool_code at all.
        pool_code = validated_data.get('pool_code', getattr(instance, 'pool_code', None))
        if pool_code:
            pool = Pools.objects.filter(pool_code=pool_code).first()
            if pool:
                validated_data['customer_pool'] = pool.pool_num
        return validated_data

    def create(self, validated_data):
        validated_data = self._apply_mac_automation(validated_data)
        validated_data = self._apply_pool_automation(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_mac_automation(validated_data)
        validated_data = self._apply_pool_automation(validated_data, instance=instance)
        return super().update(instance, validated_data)


class PoolsSerializer(TrimmedModelSerializer):
    pool_code = serializers.CharField(validators=[validate_ipv4_strict])
    # pool_netw is derived from pool_code server-side; read-only so a
    # client can't desync it from pool_code.
    pool_netw = serializers.CharField(read_only=True)
    pool_host = serializers.CharField(validators=[validate_ipv4_strict])
    pool_gtw = serializers.CharField(validators=[validate_ipv4_strict])
    pool_mask_long = serializers.CharField(validators=[validate_ipv4_strict])
    pool_mask_court = serializers.CharField()
    pool_deb = serializers.CharField(validators=[validate_ipv4_strict])
    pool_fin = serializers.CharField(validators=[validate_ipv4_strict])

    class Meta:
        model = Pools
        fields = '__all__'
        read_only_fields = ['id']

    def validate_pool_mask_court(self, value):
        validate_mask_range(value, 8, 32)
        return str(int(value)).zfill(2)

    def _apply_netw_automation(self, validated_data):
        if 'pool_code' in validated_data:
            validated_data['pool_netw'] = validated_data['pool_code']
        return validated_data

    def create(self, validated_data):
        validated_data = self._apply_netw_automation(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_netw_automation(validated_data)
        return super().update(instance, validated_data)


class IpsupsSerializer(TrimmedModelSerializer):
    ipsup_dest = serializers.CharField(validators=[validate_ipv4_strict])
    ipsup_netw = serializers.CharField(validators=[validate_ipv4_strict])
    ipsup_mask_court = serializers.CharField()
    ipsup_mask_long = serializers.CharField(validators=[validate_ipv4_strict])
    ipsup_wildcard = serializers.CharField(
        validators=[validate_wildcard], required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Ipsups
        fields = '__all__'
        read_only_fields = ['id']

    def validate_ipsup_mask_court(self, value):
        validate_mask_range(value, 8, 32)
        return str(int(value)).zfill(2)

    def validate_ipsup_netw(self, value):
        # Reciprocal of CustomersSerializer.validate_customer_ip: the same
        # address can't be a supervision network here AND a customer's
        # assigned IP over in `customers`. Mirrors IpsupForm.jsx's
        # crossChecks against customer_ip.
        if Customers.objects.filter(customer_ip=value).exists():
            raise serializers.ValidationError(
                'This network address is already used as a customer IP (customers.customer_ip)'
            )
        return value


class HbsSerializer(TrimmedModelSerializer):
    class Meta:
        model = Hbs
        fields = '__all__'
        read_only_fields = ['id']
