package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;

/**
 * Default HTTPS gateway to Razorpay. The API base is fixed to the official
 * host; a test-only transport can be injected without weakening production
 * URL validation. Secrets stay in backend runtime config and are never logged.
 */
@Service
public class RazorpayHttpGateway implements RazorpayGateway {

    public static final String DEFAULT_API_BASE = "https://api.razorpay.com/v1";
    private static final String ALLOWED_HOST = "api.razorpay.com";
    private static final String ALLOWED_PATH = "/v1";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);

    private final ObjectMapper objectMapper;
    private final String keyId;
    private final String keySecret;
    private final String apiBase;
    private final GatewayTransport transport;

    /** Minimal transport abstraction so tests never contact the real gateway. */
    interface GatewayTransport {
        GatewayResponse send(HttpRequest request, String requestBody);
    }

    record GatewayResponse(int status, String body) {
    }

    @Autowired
    public RazorpayHttpGateway(ObjectMapper objectMapper,
                               @Value("${payment.razorpay.key-id:}") String keyId,
                               @Value("${payment.razorpay.key-secret:}") String keySecret) {
        this(objectMapper, DEFAULT_API_BASE, keyId, keySecret, RazorpayHttpGateway::defaultSend);
    }

    private RazorpayHttpGateway(ObjectMapper objectMapper, String apiBase, String keyId, String keySecret,
                                GatewayTransport transport) {
        if (objectMapper == null || transport == null)
            throw new IllegalStateException("Razorpay gateway is not configured");
        this.objectMapper = objectMapper;
        this.apiBase = validateApiBase(apiBase);
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.transport = transport;
    }

    static RazorpayHttpGateway forTesting(ObjectMapper objectMapper, String apiBase, String keyId,
                                          String keySecret, GatewayTransport transport) {
        return new RazorpayHttpGateway(objectMapper, apiBase, keyId, keySecret, transport);
    }

    /** Strict validation: HTTPS, official host only, no user-info, port 443, path /v1. */
    static String validateApiBase(String value) {
        if (value == null || value.isBlank())
            throw new IllegalStateException("Razorpay API base is required");
        URI uri;
        try {
            uri = URI.create(value.trim());
        } catch (RuntimeException e) {
            throw new IllegalStateException("Invalid Razorpay API base");
        }
        if (!"https".equalsIgnoreCase(uri.getScheme()))
            throw new IllegalStateException("Razorpay API base must use HTTPS");
        if (uri.getUserInfo() != null)
            throw new IllegalStateException("Razorpay API base must not contain credentials");
        if (!ALLOWED_HOST.equalsIgnoreCase(uri.getHost()))
            throw new IllegalStateException("Unexpected Razorpay API host");
        if (uri.getPort() != -1 && uri.getPort() != 443)
            throw new IllegalStateException("Invalid Razorpay API port");
        String path = uri.getPath();
        if (path == null || (!ALLOWED_PATH.equals(path) && !ALLOWED_PATH.equals(stripTrailingSlash(path))))
            throw new IllegalStateException("Invalid Razorpay API path");
        if (uri.getQuery() != null || uri.getFragment() != null)
            throw new IllegalStateException("Invalid Razorpay API base");
        return DEFAULT_API_BASE;
    }

    private static String stripTrailingSlash(String path) {
        return path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
    }

    @Override
    public String createOrder(long amountPaise, String currency, String receipt) {
        requireConfigured();
        if (amountPaise <= 0 || currency == null || currency.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment order");
        String body;
        try {
            var payload = objectMapper.createObjectNode();
            payload.put("amount", amountPaise);
            payload.put("currency", currency.toUpperCase(Locale.ROOT));
            payload.put("receipt", receipt == null ? "srh-codeverse" : receipt);
            body = payload.toString();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBase + "/orders"))
                .header("Authorization", "Basic " + basicAuth())
                .header("Content-Type", "application/json")
                .timeout(REQUEST_TIMEOUT)
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

        GatewayResponse response = transport.send(request, body);
        if (response.status() < 200 || response.status() >= 300)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create payment order");
        try {
            JsonNode root = objectMapper.readTree(response.body());
            String id = root.path("id").asText(null);
            if (id == null || id.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Payment gateway returned no order ID");
            return id;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid payment order response");
        }
    }

    @Override
    public Payment fetchPayment(String paymentId) {
        requireConfigured();
        if (paymentId == null || paymentId.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment ID");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBase + "/payments/" + URLEncoder.encode(paymentId, StandardCharsets.UTF_8)))
                .header("Authorization", "Basic " + basicAuth())
                .timeout(REQUEST_TIMEOUT)
                .GET()
                .build();

        GatewayResponse response = transport.send(request, null);
        if (response.status() == 404)
            return null;
        if (response.status() < 200 || response.status() >= 300)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to verify payment with gateway");
        try {
            JsonNode node = objectMapper.readTree(response.body());
            return new Payment(
                    node.path("id").asText(null),
                    node.path("order_id").asText(null),
                    node.path("amount").asLong(),
                    node.path("currency").asText(null),
                    node.path("status").asText(null),
                    node.path("captured").asBoolean(false));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Invalid payment details from gateway");
        }
    }

    private void requireConfigured() {
        RazorpayConfig.validate(keyId, keySecret);
    }

    private String basicAuth() {
        return Base64.getEncoder().encodeToString(
                (keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
    }

    private static GatewayResponse defaultSend(HttpRequest request, String ignoredBody) {
        HttpClient client = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return new GatewayResponse(response.statusCode(), response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment gateway is unavailable");
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment gateway is unavailable");
        }
    }
}
