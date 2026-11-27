package com.srhcodeverse.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/** Default HTTPS gateway to Razorpay. Secrets stay in backend runtime config. */
@Service
public class RazorpayHttpGateway implements RazorpayGateway {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${payment.razorpay.key-id:}")
    private String keyId;

    @Value("${payment.razorpay.key-secret:}")
    private String keySecret;

    @Value("${payment.razorpay.api-base:https://api.razorpay.com/v1}")
    private String apiBase;

    public RazorpayHttpGateway(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Payment fetchPayment(String paymentId) {
        if (paymentId == null || paymentId.isBlank()
                || keyId == null || keyId.isBlank()
                || keySecret == null || keySecret.isBlank())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payment verification is not configured");

        String credentials = Base64.getEncoder().encodeToString(
                (keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBase + "/payments/"
                        + URLEncoder.encode(paymentId, StandardCharsets.UTF_8)))
                .header("Authorization", "Basic " + credentials)
                .timeout(Duration.ofSeconds(10))
                .GET()
                .build();

        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Unable to verify payment with gateway");
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Unable to verify payment with gateway");
        }

        if (response.statusCode() == 404)
            return null;
        if (response.statusCode() < 200 || response.statusCode() >= 300)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Unable to verify payment with gateway");

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
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Invalid payment details from gateway");
        }
    }
}
