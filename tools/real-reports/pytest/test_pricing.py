def apply_discount(total: float, member: bool) -> float:
    return total * 0.9 if member else total


def test_member_discount():
    assert apply_discount(100, True) == 90


def test_guest_price():
    assert apply_discount(100, False) == 100


def test_empty_cart_guard():
    # Intentionally failing for a real pytest failure artifact
    assert apply_discount(0, False) == 1


def test_export_csv_skipped():
    import pytest

    pytest.skip("demo only")
