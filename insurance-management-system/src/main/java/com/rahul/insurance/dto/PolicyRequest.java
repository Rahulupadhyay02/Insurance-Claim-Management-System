package com.rahul.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for creating a new Policy.
 * Used as the request body for POST /api/policies.
 */
@Data
public class PolicyRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotBlank(message = "Policy number is required")
    private String policyNumber;

    @NotBlank(message = "Policy type is required")
    // e.g. HEALTH, LIFE, AUTO, HOME
    private String policyType;

    @NotNull(message = "Coverage amount is required")
    @DecimalMin(value = "0.01", message = "Coverage amount must be positive")
    private BigDecimal coverageAmount;

    @NotNull(message = "Premium amount is required")
    @DecimalMin(value = "0.01", message = "Premium amount must be positive")
    private BigDecimal premiumAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
}
