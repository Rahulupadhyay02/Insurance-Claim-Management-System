package com.rahul.insurance.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Policy entity - represents an insurance policy.
 * Belongs to one Customer; can have many Claims.
 */
@Entity
@Table(name = "policies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Policy number is required")
    @Column(nullable = false, unique = true)
    private String policyNumber;

    @NotBlank(message = "Policy type is required")
    // e.g. HEALTH, LIFE, AUTO, HOME
    private String policyType;

    @NotNull(message = "Coverage amount is required")
    @DecimalMin(value = "0.01", message = "Coverage amount must be positive")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal coverageAmount;

    @NotNull(message = "Premium amount is required")
    @DecimalMin(value = "0.01", message = "Premium amount must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal premiumAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyStatus status = PolicyStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Many policies -> One customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonBackReference("customer-policies")
    private Customer customer;

    // One policy -> Many claims
    @OneToMany(mappedBy = "policy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonManagedReference("policy-claims")
    private List<Claim> claims;

    public enum PolicyStatus {
        ACTIVE, EXPIRED, CANCELLED, SUSPENDED
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
