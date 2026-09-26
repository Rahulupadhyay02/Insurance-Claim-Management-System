package com.rahul.insurance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Result of the Customer History Anomaly Analysis branch:
 * - Frequency Analysis
 * - Amount Patterns
 * - Time Patterns
 * - Treatment Patterns
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAnalysisResult {

    @Builder.Default
    private Double frequencyScore = 0.0;

    @Builder.Default
    private Double amountPatternScore = 0.0;

    @Builder.Default
    private Double timePatternScore = 0.0;

    @Builder.Default
    private Double treatmentPatternScore = 0.0;

    @Builder.Default
    private Double compositeAnomalyScore = 0.0;

    // Numerical metadata metrics
    private Long priorClaimsCount;
    private Integer recentClaims30d;
    private Integer recentClaims90d;
    private Double coverageRatio;
    private Double historicalAverageAmount;
    private Long daysSincePolicyStart;
    private Long daysToPolicyExpiry;
    private Long reportingLagDays;

    @Builder.Default
    private List<String> flags = new ArrayList<>();
}
