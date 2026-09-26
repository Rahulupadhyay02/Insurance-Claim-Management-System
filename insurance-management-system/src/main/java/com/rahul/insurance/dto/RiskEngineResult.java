package com.rahul.insurance.dto;

import com.rahul.insurance.entity.Claim;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result of the synthesized Risk Engine:
 * Combines Customer History Anomaly Score + LLM Text Evidence into Final Risk Score
 * and maps to Tier (LOW/MEDIUM/HIGH) and Action (NORMAL/REVIEW/INVESTIGATION).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskEngineResult {

    private Integer finalRiskScore; // 0 to 100
    private Claim.RiskLevel riskLevel; // LOW, MEDIUM, HIGH
    private String recommendedAction; // NORMAL, REVIEW, INVESTIGATION

    private AnomalyAnalysisResult anomalyResult;
    private LLMEvidenceResult llmResult;

    private String synthesisSummary;
}
