package com.rahul.insurance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI-based Claim Risk Assessment Service using Groq LLM API.
 *
 * This service directly invokes the Groq Cloud AI API (Llama 3 model)
 * to perform real natural language reasoning and risk assessment on every submitted claim.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAssessmentService {

    private final ClaimRepository claimRepository;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    @Value("${groq.api.model:llama-3.3-70b-versatile}")
    private String groqModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Assess claim risk by querying Groq LLM API.
     *
     * @param claim  The pending claim
     * @param policy The policy associated with the claim
     * @return RiskLevel (LOW, MEDIUM, or HIGH)
     */
    public Claim.RiskLevel assessRisk(Claim claim, Policy policy) {
        long priorClaimCount = claimRepository.countByPolicyCustomerId(policy.getCustomer().getId());

        String systemPrompt = """
                You are an expert AI Insurance Claims Risk Classifier.
                Analyze the provided claim details (amount, coverage, policy type, incident description, prior claim history).
                Assess the potential risk level of fraud, anomaly, or financial risk.
                You MUST respond with EXACTLY ONE word: LOW, MEDIUM, or HIGH.
                Do not include any explanation, punctuation, preambles, quotes, or markdown formatting.
                """;

        String userPrompt = String.format("""
                Evaluate this insurance claim:
                - Policy Type: %s
                - Policy Coverage Amount: ₹%s
                - Claim Amount: ₹%s
                - Incident Description: "%s"
                - Customer's Prior Claims Count: %d
                
                Risk Level (LOW, MEDIUM, or HIGH):
                """,
                policy.getPolicyType(),
                policy.getCoverageAmount(),
                claim.getClaimAmount(),
                claim.getDescription(),
                priorClaimCount
        );

        if (groqApiKey == null || groqApiKey.isBlank() || "your_groq_api_key_here".equals(groqApiKey)) {
            log.warn("Groq API key not set or using default placeholder. Set groq.api.key or GROQ_API_KEY environment variable. Defaulting risk to MEDIUM.");
            return Claim.RiskLevel.MEDIUM;
        }

        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("temperature", 0.1);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
            ));

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(groqApiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            log.info("Sending risk assessment request to Groq LLM model ({}) for claim amount ₹{}", groqModel, claim.getClaimAmount());

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                String aiContent = root.path("choices").get(0).path("message").path("content").asText("MEDIUM").trim().toUpperCase();

                log.info("Groq AI Risk Model raw response: '{}'", aiContent);

                if (aiContent.contains("HIGH")) return Claim.RiskLevel.HIGH;
                if (aiContent.contains("LOW")) return Claim.RiskLevel.LOW;
                if (aiContent.contains("MEDIUM")) return Claim.RiskLevel.MEDIUM;

                return Claim.RiskLevel.MEDIUM;
            } else {
                log.error("Groq API returned error status HTTP {}: {}", response.statusCode(), response.body());
                return Claim.RiskLevel.MEDIUM;
            }

        } catch (Exception e) {
            log.error("Exception occurred while communicating with Groq AI API: {}", e.getMessage(), e);
            return Claim.RiskLevel.MEDIUM;
        }
    }
}
