package com.rahul.insurance.controller;

import com.rahul.insurance.dto.ClaimRequest;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Claim management.
 *
 * Endpoints:
 *   POST  /api/claims                      - Submit a new claim (AI risk assessed)
 *   GET   /api/claims                      - List all claims
 *   GET   /api/claims/{id}                 - Get one claim
 *   PUT   /api/claims/{id}/approve         - Approve a claim
 *   PUT   /api/claims/{id}/reject          - Reject a claim
 *   GET   /api/claims/policy/{policyId}    - Claims by policy
 *   GET   /api/claims/status/{status}      - Claims by status
 *   GET   /api/claims/risk/{level}         - Claims by AI risk level
 */
@RestController
@RequestMapping("/api/claims")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    public ResponseEntity<Claim> submitClaim(@Valid @RequestBody ClaimRequest request) {
        Claim claim = claimService.submitClaim(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(claim);
    }

    @GetMapping
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(claimService.getAllClaims());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Claim> getClaimById(@PathVariable Long id) {
        return ResponseEntity.ok(claimService.getClaimById(id));
    }

    /**
     * Approve a claim.
     * Request body: { "reviewNotes": "Claim is valid, documents verified" }
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<Claim> approveClaim(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        String notes = (body != null) ? body.getOrDefault("reviewNotes", "") : "";
        return ResponseEntity.ok(claimService.approveClaim(id, notes));
    }

    /**
     * Reject a claim.
     * Request body: { "reviewNotes": "Insufficient documentation provided" }
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Claim> rejectClaim(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        String notes = (body != null) ? body.getOrDefault("reviewNotes", "") : "";
        return ResponseEntity.ok(claimService.rejectClaim(id, notes));
    }

    @GetMapping("/policy/{policyId}")
    public ResponseEntity<List<Claim>> getClaimsByPolicy(@PathVariable Long policyId) {
        return ResponseEntity.ok(claimService.getClaimsByPolicy(policyId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Claim>> getClaimsByStatus(
        @PathVariable Claim.ClaimStatus status
    ) {
        return ResponseEntity.ok(claimService.getClaimsByStatus(status));
    }

    /**
     * Filter claims by AI-assessed risk level (LOW / MEDIUM / HIGH).
     */
    @GetMapping("/risk/{level}")
    public ResponseEntity<List<Claim>> getClaimsByRiskLevel(
        @PathVariable Claim.RiskLevel level
    ) {
        return ResponseEntity.ok(claimService.getClaimsByRiskLevel(level));
    }
}
