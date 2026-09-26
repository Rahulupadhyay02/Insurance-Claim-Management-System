package com.rahul.insurance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rahul.insurance.dto.AnomalyAnalysisResult;
import com.rahul.insurance.dto.RiskEngineResult;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.entity.Customer;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.repository.ClaimRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnomalyAndRiskEngineTest {

    @Mock
    private ClaimRepository claimRepository;

    private AnomalyAssessmentService anomalyAssessmentService;
    private RiskAssessmentService riskAssessmentService;
    private ObjectMapper objectMapper;

    private Customer testCustomer;
    private Policy testPolicy;

    @BeforeEach
    void setUp() {
        anomalyAssessmentService = new AnomalyAssessmentService(claimRepository);
        objectMapper = new ObjectMapper();
        riskAssessmentService = new RiskAssessmentService(anomalyAssessmentService, objectMapper);

        testCustomer = Customer.builder()
                .id(1L)
                .firstName("Test")
                .lastName("Customer")
                .email("test@example.com")
                .phone("9876543210")
                .build();

        testPolicy = Policy.builder()
                .id(10L)
                .policyNumber("POL-TEST-001")
                .policyType("HEALTH")
                .coverageAmount(new BigDecimal("500000.00"))
                .premiumAmount(new BigDecimal("15000.00"))
                .startDate(LocalDate.now().minusMonths(6))
                .endDate(LocalDate.now().plusMonths(6))
                .status(Policy.PolicyStatus.ACTIVE)
                .customer(testCustomer)
                .build();
    }

    @Test
    @DisplayName("Branch 1: Clean customer history yields LOW anomaly score")
    void testCleanCustomerHistoryYieldsLowScore() {
        when(claimRepository.findByPolicyCustomerId(anyLong())).thenReturn(new ArrayList<>());

        Claim cleanClaim = Claim.builder()
                .id(null)
                .claimAmount(new BigDecimal("25000.00"))
                .description("Routine outpatient doctor consultation with prescribed fever medication")
                .incidentDate(LocalDateTime.now().minusDays(5))
                .policy(testPolicy)
                .build();

        AnomalyAnalysisResult result = anomalyAssessmentService.analyzeCustomerHistory(cleanClaim, testPolicy);

        assertNotNull(result);
        assertTrue(result.getCompositeAnomalyScore() < 30.0, "Clean record should have low anomaly score, got: " + result.getCompositeAnomalyScore());
        assertEquals(0, result.getPriorClaimsCount());
    }

    @Test
    @DisplayName("Branch 1: High frequency velocity, early inception, and high coverage utilization trigger elevated anomaly score")
    void testSuspiciousPatternsTriggerHighAnomalyScore() {
        // Customer filed 3 claims in past 60 days
        List<Claim> priorClaims = List.of(
                Claim.builder().id(101L).claimAmount(new BigDecimal("40000.00")).incidentDate(LocalDateTime.now().minusDays(15)).createdAt(LocalDateTime.now().minusDays(15)).build(),
                Claim.builder().id(102L).claimAmount(new BigDecimal("45000.00")).incidentDate(LocalDateTime.now().minusDays(35)).createdAt(LocalDateTime.now().minusDays(35)).build(),
                Claim.builder().id(103L).claimAmount(new BigDecimal("35000.00")).incidentDate(LocalDateTime.now().minusDays(55)).createdAt(LocalDateTime.now().minusDays(55)).build()
        );
        when(claimRepository.findByPolicyCustomerId(1L)).thenReturn(priorClaims);

        // New policy started only 8 days ago (early claim anomaly) and claiming 96% of coverage
        Policy brandNewPolicy = Policy.builder()
                .id(20L)
                .policyNumber("POL-NEW-002")
                .policyType("HEALTH")
                .coverageAmount(new BigDecimal("500000.00"))
                .premiumAmount(new BigDecimal("15000.00"))
                .startDate(LocalDate.now().minusDays(8))
                .endDate(LocalDate.now().plusMonths(12))
                .status(Policy.PolicyStatus.ACTIVE)
                .customer(testCustomer)
                .build();

        Claim suspiciousClaim = Claim.builder()
                .id(null)
                .claimAmount(new BigDecimal("480000.00")) // 96% coverage ratio
                .description("Hospital admission for major emergency surgery")
                .incidentDate(LocalDateTime.now().minusDays(2))
                .policy(brandNewPolicy)
                .build();

        AnomalyAnalysisResult result = anomalyAssessmentService.analyzeCustomerHistory(suspiciousClaim, brandNewPolicy);

        assertNotNull(result);
        assertTrue(result.getCompositeAnomalyScore() >= 65.0, "Suspicious history should trigger high anomaly score, got: " + result.getCompositeAnomalyScore());
        assertTrue(result.getFlags().size() >= 2, "Expected multiple anomaly flags, got: " + result.getFlags());
    }

    @Test
    @DisplayName("Synthesized Risk Engine: Evaluates claim and produces Tier and Recommended Action")
    void testRiskEngineEvaluation() {
        when(claimRepository.findByPolicyCustomerId(anyLong())).thenReturn(new ArrayList<>());

        Claim claim = Claim.builder()
                .id(null)
                .claimAmount(new BigDecimal("15000.00"))
                .description("Routine medical consultation and generic antibiotics prescription")
                .incidentDate(LocalDateTime.now().minusDays(2))
                .policy(testPolicy)
                .build();

        RiskEngineResult engineResult = riskAssessmentService.evaluateClaim(claim, testPolicy);

        assertNotNull(engineResult);
        assertNotNull(engineResult.getFinalRiskScore());
        assertNotNull(engineResult.getRiskLevel());
        assertNotNull(engineResult.getRecommendedAction());
        assertNotNull(engineResult.getAnomalyResult());
        assertNotNull(engineResult.getLlmResult());

        // Low risk claim should have NORMAL action
        assertEquals(Claim.RiskLevel.LOW, engineResult.getRiskLevel());
        assertEquals("NORMAL", engineResult.getRecommendedAction());
        assertTrue(engineResult.getFinalRiskScore() < 35);
    }
}
