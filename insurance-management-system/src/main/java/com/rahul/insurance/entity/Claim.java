package com.rahul.insurance.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Claim entity - represents an insurance claim filed against a policy.
 * Contains the AI-assessed risk level (LOW / MEDIUM / HIGH).
 */
@Entity
@Table(name = "claims")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Claim description is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Claim amount is required")
    @DecimalMin(value = "0.01", message = "Claim amount must be positive")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal claimAmount;

    @NotNull(message = "Incident date is required")
    private LocalDateTime incidentDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status = ClaimStatus.PENDING;

    /**
     * AI-assessed risk level (LOW / MEDIUM / HIGH).
     */
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    /**
     * Comprehensive risk score (0 to 100) synthesized by the Risk Engine.
     */
    @Column(name = "risk_score")
    private Integer riskScore;

    /**
     * Action recommended by the Risk Engine: NORMAL, REVIEW, or INVESTIGATION.
     */
    @Column(name = "recommended_action", length = 50)
    private String recommendedAction;

    /**
     * Statistical & behavioral anomaly score (0.0 to 100.0) from Customer History.
     */
    @Column(name = "anomaly_score")
    private Double anomalyScore;

    /**
     * Semantic NLP risk score (0.0 to 100.0) from LLM Claim Description Analysis.
     */
    @Column(name = "llm_score")
    private Double llmScore;

    /**
     * Detailed JSON breakdown of Customer History Anomaly metrics
     * (frequency, amount pattern, time pattern, treatment pattern, flags).
     */
    @Column(name = "anomaly_breakdown", columnDefinition = "TEXT")
    private String anomalyBreakdown;

    /**
     * Extracted LLM textual evidence, reasoning, and semantic flags.
     */
    @Column(name = "llm_evidence", columnDefinition = "TEXT")
    private String llmEvidence;

    /**
     * Reason provided when approving or rejecting the claim.
     */
    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime reviewedAt;

    // Many claims -> One policy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonBackReference("policy-claims")
    private Policy policy;

    /**
     * Expose safe policy details for client rendering without circular reference.
     */
    @com.fasterxml.jackson.annotation.JsonProperty("policyNumber")
    public String getPolicyNumber() {
        return policy != null ? policy.getPolicyNumber() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("policyType")
    public String getPolicyType() {
        return policy != null ? policy.getPolicyType() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("policyDetails")
    public java.util.Map<String, Object> getPolicyDetails() {
        if (policy == null) return null;
        java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", policy.getId());
        map.put("policyNumber", policy.getPolicyNumber());
        map.put("policyType", policy.getPolicyType());
        map.put("coverageAmount", policy.getCoverageAmount());
        map.put("startDate", policy.getStartDate());
        map.put("endDate", policy.getEndDate());
        map.put("status", policy.getStatus());
        return map;
    }

    public enum ClaimStatus {
        PENDING, UNDER_REVIEW, APPROVED, REJECTED
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
