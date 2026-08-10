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
     * AI-assessed risk level.
     * Set by the RiskAssessmentService based on claim amount,
     * claim frequency, and policy coverage ratio.
     */
    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

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
