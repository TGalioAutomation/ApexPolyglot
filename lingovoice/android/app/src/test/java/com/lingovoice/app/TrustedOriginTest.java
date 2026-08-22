package com.lingovoice.app;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public final class TrustedOriginTest {
    @Test
    public void acceptsConfiguredOriginWithEquivalentDefaultPort() {
        assertTrue(TrustedOrigin.matches("https://lingovoice.example/app", "https://lingovoice.example"));
    }

    @Test
    public void rejectsDifferentHostSchemeOrPort() {
        assertFalse(TrustedOrigin.matches("http://10.0.2.2:4175", "http://evil.example:4175"));
        assertFalse(TrustedOrigin.matches("http://10.0.2.2:4175", "https://10.0.2.2:4175"));
        assertFalse(TrustedOrigin.matches("http://10.0.2.2:4175", "http://10.0.2.2:9999"));
    }

    @Test
    public void createsExactWebMessageOriginRule() {
        assertEquals("http://10.0.2.2:4175", TrustedOrigin.rule("http://10.0.2.2:4175/app"));
        assertEquals("https://lingovoice.example", TrustedOrigin.rule("https://LINGOVOICE.example/path"));
    }
}
