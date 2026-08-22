package com.lingovoice.app;

import static org.junit.Assert.assertEquals;

import android.speech.SpeechRecognizer;
import org.junit.Test;

public final class SpeechErrorMapperTest {
    @Test
    public void mapsActionableErrors() {
        assertEquals("permission_denied", SpeechErrorMapper.code(SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS));
        assertEquals("no_match", SpeechErrorMapper.code(SpeechRecognizer.ERROR_NO_MATCH));
        assertEquals("network", SpeechErrorMapper.code(SpeechRecognizer.ERROR_NETWORK_TIMEOUT));
    }
}
