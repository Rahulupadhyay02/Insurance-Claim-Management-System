package com.rahul.insurance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for submitting a new Claim.
 * Used as the request body for POST /api/claims.
 */
@Data
public class ClaimRequest {

    @NotNull(message = "Policy ID is required")
    private Long policyId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Claim amount is required")
    @DecimalMin(value = "0.01", message = "Claim amount must be positive")
    private BigDecimal claimAmount;

    @NotNull(message = "Incident date is required")
    private LocalDateTime incidentDate;
}
