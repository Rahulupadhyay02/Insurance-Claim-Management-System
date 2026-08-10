package com.rahul.insurance.controller;

import com.rahul.insurance.dto.PolicyRequest;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.service.PolicyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Policy management.
 *
 * Endpoints:
 *   POST  /api/policies                           - Create a policy
 *   GET   /api/policies                           - List all policies
 *   GET   /api/policies/{id}                      - Get one policy
 *   GET   /api/policies/customer/{customerId}     - List policies for a customer
 */
@RestController
@RequestMapping("/api/policies")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PolicyController {

    private final PolicyService policyService;

    @PostMapping
    public ResponseEntity<Policy> createPolicy(@Valid @RequestBody PolicyRequest request) {
        Policy policy = policyService.createPolicy(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(policy);
    }

    @GetMapping
    public ResponseEntity<List<Policy>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Policy> getPolicyById(@PathVariable Long id) {
        return ResponseEntity.ok(policyService.getPolicyById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Policy>> getPoliciesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(policyService.getPoliciesByCustomer(customerId));
    }
}
