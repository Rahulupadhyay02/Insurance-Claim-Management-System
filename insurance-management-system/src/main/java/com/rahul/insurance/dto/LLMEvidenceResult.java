package com.rahul.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of the LLM Text & Context Analysis branch on Claim Description.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LLMEvidenceResult {

    @Builder.Default
    private Double llmScore = 0.0;

    @Builder.Default
    private String credibility = "MODERATE"; // HIGH, MODERATE, SUSPICIOUS

    @Builder.Default
    private String sentimentAnalysis = "Standard incident reporting tone";

    @Builder.Default
    private List<String> semanticFlags = new ArrayList<>();

    @Builder.Default
    private String evidenceSummary = "";

    @Builder.Default
    private String modelUsed = "groq-llm";
}
