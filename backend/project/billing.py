from datetime import datetime, timezone

PREMIUM_DISCOUNT_PERCENT = 10
MINIMUM_STRIPE_AMOUNT_BY_CURRENCY = {
    'ron': 200,
}


def parse_booking_datetime(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError('Missing or invalid datetime value.')
    candidate = value.strip()
    if candidate.endswith('Z'):
        candidate = candidate[:-1] + '+00:00'
    parsed = datetime.fromisoformat(candidate.replace(' ', 'T'))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def calculate_booking_price(spot, start_date, end_date, discount_percent=0):
    operating_hours = 24.0
    try:
        start_parts = [int(part) for part in (spot.start_hour or '').split(':')]
        end_parts = [int(part) for part in (spot.end_hour or '').split(':')]
        start_hour = start_parts[0] + (start_parts[1] / 60 if len(start_parts) > 1 else 0)
        end_hour = end_parts[0] + (end_parts[1] / 60 if len(end_parts) > 1 else 0)
        if end_hour > start_hour:
            operating_hours = end_hour - start_hour
    except (TypeError, ValueError, IndexError):
        pass

    duration_hours = (end_date - start_date).total_seconds() / 3600
    subtotal = round(duration_hours * (float(spot.price_per_day) / operating_hours), 2)
    discount = round(subtotal * discount_percent / 100, 2)
    return {
        'subtotal': subtotal,
        'discount': discount,
        'total': round(subtotal - discount, 2),
    }


def to_stripe_amount(amount):
    return int(round(amount * 100))


def minimum_stripe_amount(currency):
    return MINIMUM_STRIPE_AMOUNT_BY_CURRENCY.get(currency.lower())
