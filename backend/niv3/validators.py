# backend/validators.py
#
# Server-side mirror of frontend/src/utils/validators.js. The frontend
# gives instant feedback, but these are the actual safety net — anyone
# hitting the API directly (curl, Postman, a bug in the UI) still can't
# get bad data into MySQL.

import re
from django.core.exceptions import ValidationError
from django.core.validators import validate_ipv4_address

MAC_PATTERN = re.compile(r'^[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}\.[0-9a-fA-F]{4}$')


def validate_mac_format(value):
    """c83a.4578.96f7 — hex only, dot-grouped 4-4-4."""
    if not value or not MAC_PATTERN.match(value):
        raise ValidationError(
            '%(value)s is not a valid hexadecimal MAC address. '
            'Expected format: c83a.4578.96f7',
            params={'value': value},
        )


def validate_ipv4_strict(value):
    """
    Thin wrapper around Django's built-in validator, kept as its own
    function so every field that needs "ipv4 notation" imports from one
    place and the error message stays consistent across the app.
    """
    try:
        validate_ipv4_address(value)
    except ValidationError:
        raise ValidationError(
            '%(value)s is not a valid IPv4 address (expected e.g. 41.204.103.205)',
            params={'value': value},
        )


def validate_mask_range(value, min_prefix=8, max_prefix=32):
    """Prefix length stored as a 2-char string, e.g. '08', '24', '32'."""
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise ValidationError('%(value)s is not a valid mask/prefix length', params={'value': value})
    if not (min_prefix <= n <= max_prefix):
        raise ValidationError(
            'Mask /%(value)s is out of range — must be between /%(min)s and /%(max)s',
            params={'value': n, 'min': min_prefix, 'max': max_prefix},
        )


def validate_wildcard(value):
    """Wildcard masks use the same dotted 4-octet shape as an IPv4 address."""
    validate_ipv4_strict(value)
