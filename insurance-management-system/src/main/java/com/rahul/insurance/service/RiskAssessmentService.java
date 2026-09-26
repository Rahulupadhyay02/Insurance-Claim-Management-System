package com.rahul.insurance.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rahul.insurance.dto.AnomalyAnalysisResult;
import com.rahul.insurance.dto.LLMEvidenceResult;
import com.rahul.insurance.dto.RiskEngineResult;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.entity.Policy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Enterprise Risk Engine Service.
 *
 * Implements the synthesized Dual-Branch Architecture:
 *
 *                       CLAIM
 *                         ↓
 *              ┌──────────┴──────────┐
 *              ↓                     ↓
 *       Customer History        Claim Description
 *              ↓                     ↓
 *       Frequency Analysis            LLM
 *       Amount Patterns               ↓
 *       Time Patterns          Text/Context Analysis
 *       Treatment Patterns
 *              ↓                     ↓
 *        Anomaly Score          LLM Evidence
 *              └──────────┬──────────┘
 *                         ↓
 *                   RISK ENGINE
 *                         ↓
 *                  Final Risk Score
 *                         ↓
 *              ┌──────────┼──────────┐
 *              ↓          ↓          ↓
 *             LOW       MEDIUM      HIGH
 *              ↓          ↓          ↓
 *            Normal     Review   Investigation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskAssessmentService {

    private final AnomalyAssessmentService anomalyAssessmentService;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String groqApiUrl;

    @Value("${groq.api.key:your_groq_api_key_here}")
    private String groqApiKey;

    @Value("${groq.api.model:openai/gpt-oss-120b}")
    private String groqModel;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Complete Risk Engine Execution:
     * Evaluates both Customer History (Branch 1) and Claim Description NLP (Branch 2),
     * synthesizes them through the Risk Engine, and returns the comprehensive evaluation.
     */
    public RiskEngineResult evaluateClaim(Claim claim, Policy policy) {
        log.info("Initiating Dual-Branch Risk Engine for Claim amount ₹{}, Policy {}",
                claim.getClaimAmount(), policy.getPolicyNumber());

        // ── Branch 1: Customer History Anomaly Engine ────────────────────────
        AnomalyAnalysisResult anomalyResult = anomalyAssessmentService.analyzeCustomerHistory(claim, policy);

        // ── Branch 2: Claim Description LLM Semantic & Context Analysis ──────
        LLMEvidenceResult llmResult = analyzeDescriptionWithLLM(claim, policy);

        // ── RISK ENGINE Synthesis ────────────────────────────────────────────
        double anomalyScore = anomalyResult.getCompositeAnomalyScore();
        double llmScore = llmResult.getLlmScore();

        // 45% Historical Anomaly + 55% Semantic LLM Evidence
        double weightedScore = (anomalyScore * 0.45) + (llmScore * 0.55);

        // Escalation rules:
        // 1. Both engines detect elevated risk
        if (anomalyScore >= 60.0 && llmScore >= 60.0) {
            weightedScore = Math.max(weightedScore, 75.0);
        }
        // 2. High severity anomaly flag (e.g. early inception claim + near-max coverage)
        if (anomalyScore >= 75.0 && weightedScore < 70.0) {
            weightedScore = Math.max(weightedScore, 70.0);
        }
        // 3. Both clean
        if (anomalyScore <= 20.0 && llmScore <= 20.0) {
            weightedScore = Math.min(weightedScore, 20.0);
        }

        int finalScore = (int) Math.round(Math.min(100.0, Math.max(0.0, weightedScore)));

        // Classification & Recommended Action
        Claim.RiskLevel riskLevel;
        String recommendedAction;

        if (finalScore < 35) {
            riskLevel = Claim.RiskLevel.LOW;
            recommendedAction = "NORMAL"; // Straight-Through Processing (STP)
        } else if (finalScore < 70) {
            riskLevel = Claim.RiskLevel.MEDIUM;
            recommendedAction = "REVIEW"; // Adjuster Manual Verification
        } else {
            riskLevel = Claim.RiskLevel.HIGH;
            recommendedAction = "INVESTIGATION"; // Special Investigation Unit (SIU)
        }

        String synthesisSummary = String.format(
                "Risk Engine classified claim as %s (%d/100) -> Action: %s. Anomaly Score: %.1f, LLM Semantic Score: %.1f.",
                riskLevel, finalScore, recommendedAction, anomalyScore, llmScore
        );

        log.info(synthesisSummary);

        return RiskEngineResult.builder()
                .finalRiskScore(finalScore)
                .riskLevel(riskLevel)
                .recommendedAction(recommendedAction)
                .anomalyResult(anomalyResult)
                .llmResult(llmResult)
                .synthesisSummary(synthesisSummary)
                .build();
    }

    /**
     * Backward-compatible helper method returning just RiskLevel.
     */
    public Claim.RiskLevel assessRisk(Claim claim, Policy policy) {
        return evaluateClaim(claim, policy).getRiskLevel();
    }

    // ─── Branch 2: LLM Text & Context Analysis ──────────────────────────────────

    private LLMEvidenceResult analyzeDescriptionWithLLM(Claim claim, Policy policy) {
        String description = claim.getDescription() != null ? claim.getDescription().trim() : "";

        if (groqApiKey == null || groqApiKey.isBlank() || "your_groq_api_key_here".equals(groqApiKey)) {
            log.warn("Groq API key not configured. Using local heuristic NLP analyzer.");
            return fallbackTextAnalysis(claim, policy, "Local heuristic analyzer (API key not configured)");
        }

        String systemPrompt = """
                You are an expert Insurance Claims Fraud & Semantic Risk Investigator.
                Analyze the claim description in the context of the policy type, claim amount, and coverage.
                Examine:
                1. Plausibility, clinical/operational credibility, and internal narrative consistency.
                2. Semantic ambiguity (vague descriptions vs specific diagnostic/repair details).
                3. Cost-to-severity proportionality (is the claimed amount disproportionately high for the described event?).
                4. Potential fraud markers (e.g. inconsistent timelines, exaggerated urgency, missing critical details).

                You MUST return ONLY a valid, raw JSON object without markdown formatting or conversational commentary, adhering strictly to this schema:
                {
                  "llmScore": <integer between 0 and 100>,
                  "credibility": "<HIGH | MODERATE | SUSPICIOUS>",
                  "sentimentAnalysis": "<1 concise sentence on linguistic tone>",
                  "semanticFlags": ["<flag 1>", "<flag 2>"],
                  "evidenceSummary": "<2-3 sentences summarizing key textual observations, consistency, and risk reasoning>"
                }
                """;

        String userPrompt = String.format("""
                Evaluate this insurance claim submission:
                - Policy Type: %s
                - Policy Coverage Amount: ₹%s
                - Requested Claim Amount: ₹%s
                - Claim Description: "%s"
                - Incident Date: %s
                
                Analyze the text description and provide the JSON assessment:
                """,
                policy.getPolicyType(),
                policy.getCoverageAmount(),
                claim.getClaimAmount(),
                description,
                claim.getIncidentDate() != null ? claim.getIncidentDate().toString() : "Unspecified"
        );

        // Try primary model, with fallback models if model is deprecated
        List<String> candidateModels = List.of(groqModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b");

        for (String modelToTry : candidateModels) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", modelToTry);
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
                        .timeout(Duration.ofSeconds(12))
                        .build();

                log.info("Submitting claim text to Groq LLM ({}) for semantic analysis...", modelToTry);

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    String rawContent = root.path("choices").get(0).path("message").path("content").asText("").trim();

                    // Strip markdown wrapping if present
                    String cleanJson = extractJson(rawContent);
                    JsonNode parsed = objectMapper.readTree(cleanJson);

                    double score = parsed.path("llmScore").asDouble(40.0);
                    score = Math.min(100.0, Math.max(0.0, score));

                    String credibility = parsed.path("credibility").asText("MODERATE");
                    String sentiment = parsed.path("sentimentAnalysis").asText("Neutral incident report");
                    String evidence = parsed.path("evidenceSummary").asText("Standard description provided.");

                    List<String> flags = new ArrayList<>();
                    if (parsed.has("semanticFlags") && parsed.get("semanticFlags").isArray()) {
                        for (JsonNode f : parsed.get("semanticFlags")) {
                            flags.add(f.asText());
                        }
                    }

                    log.info("Groq LLM analysis complete: model={}, score={}, credibility={}, flags={}",
                            modelToTry, score, credibility, flags.size());

                    return LLMEvidenceResult.builder()
                            .llmScore(score)
                            .credibility(credibility)
                            .sentimentAnalysis(sentiment)
                            .semanticFlags(flags)
                            .evidenceSummary(evidence)
                            .modelUsed(modelToTry)
                            .build();

                } else if (response.statusCode() == 404) {
                    log.warn("Groq model {} returned 404, attempting next candidate...", modelToTry);
                    continue;
                } else {
                    log.error("Groq API error HTTP {}: {}", response.statusCode(), response.body());
                    break;
                }

            } catch (Exception e) {
                log.warn("Error invoking Groq model {}: {}", modelToTry, e.getMessage());
            }
        }

        log.warn("Falling back to local heuristic NLP analysis due to Groq API unavailability.");
        return fallbackTextAnalysis(claim, policy, "Local heuristic fallback (LLM unreachable)");
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    /**
     * Resilient Rule-Based Text & Context Analyzer for when Groq API is offline or unreachable.
     */
    private LLMEvidenceResult fallbackTextAnalysis(Claim claim, Policy policy, String modelName) {
        String desc = claim.getDescription() != null ? claim.getDescription().trim() : "";
        String descLower = desc.toLowerCase();
        double score = 25.0;
        List<String> flags = new ArrayList<>();

        // Length & vagueness heuristic
        if (desc.length() < 25) {
            score += 35.0;
            flags.add("Excessively brief or vague incident description");
        } else if (desc.length() > 60) {
            score -= 10.0; // Detailed descriptions tend to be more legitimate
        }

        // Suspicious phrasing markers
        List<String> suspiciousPhrases = List.of(
                "cash", "urgent payout", "immediate cash", "lost bills", "no receipt",
                "police not informed", "unwitnessed", "total loss", "maximum payout"
        );
        for (String phrase : suspiciousPhrases) {
            if (descLower.contains(phrase)) {
                score += 20.0;
                flags.add("Suspicious textual marker detected: '" + phrase + "'");
            }
        }

        // Policy type specificity check
        String pType = policy.getPolicyType() != null ? policy.getPolicyType().toUpperCase() : "GENERAL";
        if ("HEALTH".equals(pType) && !descLower.contains("hospital") && !descLower.contains("doctor")
                && !descLower.contains("clinic") && !descLower.contains("treatment") && !descLower.contains("admission")) {
            score += 15.0;
            flags.add("Health claim lacks standard medical facility or provider references");
        } else if ("AUTO".equals(pType) && !descLower.contains("damage") && !descLower.contains("repair")
                && !descLower.contains("car") && !descLower.contains("accident")) {
            score += 15.0;
            flags.add("Auto claim lacks specific vehicle damage or accident details");
        }

        score = Math.min(100.0, Math.max(5.0, Math.round(score * 10.0) / 10.0));
        String credibility = score >= 65 ? "SUSPICIOUS" : (score >= 40 ? "MODERATE" : "HIGH");
        String evidence = String.format(
                "Incident narrative evaluated with %d character length and %d contextual markers. Credibility classified as %s.",
                desc.length(), flags.size(), credibility
        );

        return LLMEvidenceResult.builder()
                .llmScore(score)
                .credibility(credibility)
                .sentimentAnalysis("Evaluated via contextual pattern matching")
                .semanticFlags(flags)
                .evidenceSummary(evidence)
                .modelUsed(modelName)
                .build();
    }
}
