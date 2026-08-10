package com.rahul.insurance.repository;

import com.rahul.insurance.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Claim CRUD operations.
 */
@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {

    // Find all claims for a specific policy
    List<Claim> findByPolicyId(Long policyId);

    // Find all claims by status
    List<Claim> findByStatus(Claim.ClaimStatus status);

    // Find all claims for a specific customer (via policy)
    List<Claim> findByPolicyCustomerId(Long customerId);

    // Find all claims by risk level (used for AI reporting)
    List<Claim> findByRiskLevel(Claim.RiskLevel riskLevel);

    // Count how many claims a customer has across all policies
    long countByPolicyCustomerId(Long customerId);
}
