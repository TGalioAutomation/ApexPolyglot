package com.lingovoice.app;

import java.net.URI;
import java.util.Locale;

final class TrustedOrigin {
    private TrustedOrigin() {}

    static boolean matches(String configuredServerUrl, String candidateOrigin) {
        try {
            URI configured = URI.create(configuredServerUrl);
            URI candidate = URI.create(candidateOrigin);
            int configuredPort = effectivePort(configured);
            int candidatePort = effectivePort(candidate);
            return configured.getScheme() != null
                    && configured.getScheme().equalsIgnoreCase(candidate.getScheme())
                    && configured.getHost() != null
                    && configured.getHost().equalsIgnoreCase(candidate.getHost())
                    && configuredPort == candidatePort;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }

    static String rule(String configuredServerUrl) {
        URI uri = URI.create(configuredServerUrl);
        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (scheme == null || host == null || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
            throw new IllegalArgumentException("Server URL must use http or https");
        }
        String renderedHost = host.contains(":") ? "[" + host + "]" : host;
        int port = effectivePort(uri);
        boolean defaultPort = ("http".equalsIgnoreCase(scheme) && port == 80)
                || ("https".equalsIgnoreCase(scheme) && port == 443);
        return scheme.toLowerCase(Locale.ROOT) + "://" + renderedHost.toLowerCase(Locale.ROOT) + (defaultPort ? "" : ":" + port);
    }

    private static int effectivePort(URI uri) {
        if (uri.getPort() >= 0) return uri.getPort();
        if ("https".equalsIgnoreCase(uri.getScheme())) return 443;
        if ("http".equalsIgnoreCase(uri.getScheme())) return 80;
        return -1;
    }
}
