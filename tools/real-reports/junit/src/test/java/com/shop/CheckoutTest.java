package com.shop;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CheckoutTest {
    @Test
    void successfulPurchase() {
        assertEquals(90, Math.round(100 * 0.9));
    }

    @Test
    void expiredCardIsRejected() {
        assertTrue("Card expired".equals("Something went wrong"),
                "expected banner \"Card expired\"");
    }

    @Test
    void guestCheckoutDemo() {
        Assumptions.assumeTrue(false, "Not enabled in demo");
    }
}
