package com.rahul.insurance.service;

import com.rahul.insurance.dto.ClaimRequest;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.exception.BusinessException;
import com.rahul.insurance.exception.ResourceNotFoundException;
import com.rahul.insurance.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service layer for Claim business logic.
 *
 * Business rules:
 * - Claims can only be filed against ACTIVE policies
 * - Claim amount cannot exceed policy coverage amount
 * - Only PENDING or UNDER_REVIEW claims can be approved/rejected
 * - AI risk level is assigned automatically at submission time
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final PolicyService policyService;
    private final RiskAssessmentService riskAssessmentService;

    /**
     * Submit a new claim.
     * Automatically runs AI risk assessment and stores the risk level.
     */
    public Claim submitClaim(ClaimRequest request) {
        Policy policy = policyService.getPolicyById(request.getPolicyId());

        // Business rule: can only claim on an ACTIVE policy
        if (policy.getStatus() != Policy.PolicyStatus.ACTIVE) {
            throw new BusinessException(
                "Cannot submit a claim on a policy with status: " + policy.getStatus()
            );
        }

        // Business rule: claim amount must not exceed coverage
        if (request.getClaimAmount().compareTo(policy.getCoverageAmount()) > 0) {
            throw new BusinessException(
                "Claim amount (" + request.getClaimAmount() + ") exceeds policy coverage ("
                + policy.getCoverageAmount() + ")"
            );
        }

        Claim claim = Claim.builder()
            .description(request.getDescription())
            .claimAmount(request.getClaimAmount())
            .incidentDate(request.getIncidentDate())
            .status(Claim.ClaimStatus.PENDING)
            .policy(policy)
            .build();

        // ── AI Risk Assessment ─────────────────────────────────────────────────
        Claim.RiskLevel riskLevel = riskAssessmentService.assessRisk(claim, policy);
        claim.setRiskLevel(riskLevel);

        Claim saved = claimRepository.save(claim);
        log.info("Submitted claim id={}, policy={}, amount={}, riskLevel={}",
            saved.getId(), policy.getPolicyNumber(), saved.getClaimAmount(), riskLevel);
        return saved;
    }

    /**
     * Get all claims.
     */
    @Transactional(readOnly = true)
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /**
     * Get a single claim by ID.
     */
    @Transactional(readOnly = true)
    public Claim getClaimById(Long id) {
        return claimRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Claim", id));
    }

    /**
     * Get all claims for a specific policy.
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByPolicy(Long policyId) {
        policyService.getPolicyById(policyId); // verify policy exists
        return claimRepository.findByPolicyId(policyId);
    }

    /**
     * Approve a claim.
     * Only valid for PENDING or UNDER_REVIEW claims.
     */
    public Claim approveClaim(Long id, String reviewNotes) {
        Claim claim = getClaimById(id);
        validateClaimForReview(claim);

        claim.setStatus(Claim.ClaimStatus.APPROVED);
        claim.setReviewNotes(reviewNotes);
        claim.setReviewedAt(LocalDateTime.now());

        Claim saved = claimRepository.save(claim);
        log.info("Approved claim id={}", id);
        return saved;
    }

    /**
     * Reject a claim.
     * Only valid for PENDING or UNDER_REVIEW claims.
     */
    public Claim rejectClaim(Long id, String reviewNotes) {
        Claim claim = getClaimById(id);
        validateClaimForReview(claim);

        claim.setStatus(Claim.ClaimStatus.REJECTED);
        claim.setReviewNotes(reviewNotes);
        claim.setReviewedAt(LocalDateTime.now());

        Claim saved = claimRepository.save(claim);
        log.info("Rejected claim id={}", id);
        return saved;
    }

    /**
     * Get all claims filtered by status.
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByStatus(Claim.ClaimStatus status) {
        return claimRepository.findByStatus(status);
    }

    /**
     * Get all claims filtered by AI risk level.
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByRiskLevel(Claim.RiskLevel riskLevel) {
        return claimRepository.findByRiskLevel(riskLevel);
    }

    // ─── Private helpers ─────────────────────────────────────────────────────────

    private void validateClaimForReview(Claim claim) {
        if (claim.getStatus() == Claim.ClaimStatus.APPROVED
            || claim.getStatus() == Claim.ClaimStatus.REJECTED) {
            throw new BusinessException(
                "Claim id=" + claim.getId() + " has already been " + claim.getStatus()
            );
        }
    }
}
