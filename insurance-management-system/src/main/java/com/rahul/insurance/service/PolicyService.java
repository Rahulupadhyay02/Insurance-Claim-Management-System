package com.rahul.insurance.service;

import com.rahul.insurance.dto.PolicyRequest;
import com.rahul.insurance.entity.Customer;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.exception.BusinessException;
import com.rahul.insurance.exception.ResourceNotFoundException;
import com.rahul.insurance.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Service layer for Policy business logic.
 *
 * Business rules:
 * - Policy number must be unique
 * - End date must be after start date
 * - Customer must exist before attaching a policy
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final CustomerService customerService;

    /**
     * Create a new insurance policy for a customer.
     */
    public Policy createPolicy(PolicyRequest request) {
        // Validate date range
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new BusinessException("End date must be after start date");
        }

        // Ensure policy number is unique
        if (policyRepository.existsByPolicyNumber(request.getPolicyNumber())) {
            throw new BusinessException(
                "Policy number '" + request.getPolicyNumber() + "' already exists"
            );
        }

        // Look up the customer (throws 404 if not found)
        Customer customer = customerService.getCustomerById(request.getCustomerId());

        Policy policy = Policy.builder()
            .policyNumber(request.getPolicyNumber())
            .policyType(request.getPolicyType())
            .coverageAmount(request.getCoverageAmount())
            .premiumAmount(request.getPremiumAmount())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .status(Policy.PolicyStatus.ACTIVE)
            .customer(customer)
            .build();

        Policy saved = policyRepository.save(policy);
        log.info("Created policy id={}, number={}, customerId={}",
            saved.getId(), saved.getPolicyNumber(), customer.getId());
        return saved;
    }

    /**
     * Get all policies.
     */
    @Transactional(readOnly = true)
    public List<Policy> getAllPolicies() {
        return policyRepository.findAll();
    }

    /**
     * Get a single policy by ID.
     */
    @Transactional(readOnly = true)
    public Policy getPolicyById(Long id) {
        return policyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Policy", id));
    }

    /**
     * Get all policies for a specific customer.
     */
    @Transactional(readOnly = true)
    public List<Policy> getPoliciesByCustomer(Long customerId) {
        // Verify customer exists
        customerService.getCustomerById(customerId);
        return policyRepository.findByCustomerId(customerId);
    }

    /**
     * Auto-expire policies whose end date has passed.
     * In production this would be called by a scheduled job.
     */
    public void expireOldPolicies() {
        List<Policy> activePolicies = policyRepository.findByStatus(Policy.PolicyStatus.ACTIVE);
        LocalDate today = LocalDate.now();
        activePolicies.stream()
            .filter(p -> p.getEndDate().isBefore(today))
            .forEach(p -> {
                p.setStatus(Policy.PolicyStatus.EXPIRED);
                policyRepository.save(p);
                log.info("Auto-expired policy id={}", p.getId());
            });
    }
}
