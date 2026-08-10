package com.rahul.insurance.repository;

import com.rahul.insurance.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Policy CRUD operations.
 */
@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    // Find all policies belonging to a specific customer
    List<Policy> findByCustomerId(Long customerId);

    // Find by unique policy number
    Optional<Policy> findByPolicyNumber(String policyNumber);

    // Check if policy number already exists
    boolean existsByPolicyNumber(String policyNumber);

    // Find policies by status
    List<Policy> findByStatus(Policy.PolicyStatus status);

    // Count how many claims a policy already has (used for risk assessment)
    @Query("SELECT COUNT(c) FROM Claim c WHERE c.policy.id = :policyId")
    long countClaimsByPolicyId(@Param("policyId") Long policyId);
}
