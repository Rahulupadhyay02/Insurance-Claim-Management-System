package com.rahul.insurance.service;

import com.rahul.insurance.dto.AnomalyAnalysisResult;
import com.rahul.insurance.entity.Claim;
import com.rahul.insurance.entity.Policy;
import com.rahul.insurance.repository.ClaimRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Customer History & Statistical Anomaly Assessment Engine.
 *
 * Implements the first branch of the Risk Architecture:
 *   Claim -> Customer History -> Frequency, Amount, Time, Treatment Patterns -> Anomaly Score
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnomalyAssessmentService {

    private final ClaimRepository claimRepository;

    /**
     * Analyze Customer History across Frequency, Amount, Time, and Treatment patterns.
     */
    public AnomalyAnalysisResult analyzeCustomerHistory(Claim currentClaim, Policy policy) {
        Long customerId = policy.getCustomer() != null ? policy.getCustomer().getId() : null;
        List<Claim> customerClaims = (customerId != null)
                ? claimRepository.findByPolicyCustomerId(customerId)
                : Collections.emptyList();

        // Filter out current unpersisted claim or matching ID
        List<Claim> priorClaims = customerClaims.stream()
                .filter(c -> currentClaim.getId() == null || !currentClaim.getId().equals(c.getId()))
                .toList();

        List<String> flags = new ArrayList<>();

        // 1. Frequency Analysis
        FrequencyMetrics freq = evaluateFrequency(priorClaims, currentClaim, flags);

        // 2. Amount Patterns
        AmountMetrics amount = evaluateAmountPatterns(priorClaims, currentClaim, policy, flags);

        // 3. Time Patterns
        TimeMetrics time = evaluateTimePatterns(priorClaims, currentClaim, policy, flags);

        // 4. Treatment / Category Patterns
        TreatmentMetrics treatment = evaluateTreatmentPatterns(priorClaims, currentClaim, policy, flags);

        // 5. Composite Anomaly Score (Weighted Combination)
        // Frequency: 25%, Amount: 35%, Time: 25%, Treatment: 15%
        double composite = (freq.score * 0.25)
                + (amount.score * 0.35)
                + (time.score * 0.25)
                + (treatment.score * 0.15);

        // Hard alert boost: if multiple high flags are present, boost composite
        if (flags.size() >= 3 && composite < 70.0) {
            composite = Math.min(100.0, composite + 15.0);
        }
        composite = Math.round(Math.min(100.0, Math.max(0.0, composite)) * 10.0) / 10.0;

        log.info("Anomaly Analysis for customer id={}: Composite={}, Freq={}, Amount={}, Time={}, Treatment={}, Flags={}",
                customerId, composite, freq.score, amount.score, time.score, treatment.score, flags.size());

        return AnomalyAnalysisResult.builder()
                .frequencyScore(freq.score)
                .amountPatternScore(amount.score)
                .timePatternScore(time.score)
                .treatmentPatternScore(treatment.score)
                .compositeAnomalyScore(composite)
                .priorClaimsCount((long) priorClaims.size())
                .recentClaims30d(freq.claims30d)
                .recentClaims90d(freq.claims90d)
                .coverageRatio(amount.coverageRatio)
                .historicalAverageAmount(amount.historicalAverage)
                .daysSincePolicyStart(time.daysSinceStart)
                .daysToPolicyExpiry(time.daysToExpiry)
                .reportingLagDays(time.reportingLag)
                .flags(flags)
                .build();
    }

    // ─── 1. Frequency Analysis ───────────────────────────────────────────────────

    private static class FrequencyMetrics {
        double score;
        int claims30d;
        int claims90d;
    }

    private FrequencyMetrics evaluateFrequency(List<Claim> priorClaims, Claim currentClaim, List<String> flags) {
        FrequencyMetrics m = new FrequencyMetrics();
        LocalDateTime refDate = currentClaim.getIncidentDate() != null
                ? currentClaim.getIncidentDate()
                : LocalDateTime.now();

        int c30 = 0;
        int c90 = 0;
        for (Claim c : priorClaims) {
            LocalDateTime created = c.getCreatedAt() != null ? c.getCreatedAt() : c.getIncidentDate();
            if (created != null) {
                long days = Math.abs(ChronoUnit.DAYS.between(created, refDate));
                if (days <= 30) c30++;
                if (days <= 90) c90++;
            }
        }
        m.claims30d = c30;
        m.claims90d = c90;

        int totalCount = priorClaims.size();
        double baseScore = 5.0; // Clean record baseline

        if (totalCount == 1) {
            baseScore = 15.0;
        } else if (totalCount == 2) {
            baseScore = 30.0;
        } else if (totalCount >= 3) {
            baseScore = Math.min(85.0, 50.0 + (totalCount - 3) * 12.0);
            flags.add("High lifetime claim count: " + totalCount + " prior claims recorded for this customer");
        }

        // Velocity Spike checks
        if (c30 >= 1) {
            baseScore += 25.0;
            flags.add("Velocity spike: claim filed within 30 days of previous claim (" + c30 + " claim in last 30d)");
        }
        if (c90 >= 2) {
            baseScore += 25.0;
            flags.add("High claim velocity: " + c90 + " claims submitted within the past 90 days");
        }

        m.score = Math.min(100.0, Math.max(0.0, Math.round(baseScore * 10.0) / 10.0));
        return m;
    }

    // ─── 2. Amount Patterns ──────────────────────────────────────────────────────

    private static class AmountMetrics {
        double score;
        double coverageRatio;
        Double historicalAverage;
    }

    private AmountMetrics evaluateAmountPatterns(List<Claim> priorClaims, Claim currentClaim, Policy policy, List<String> flags) {
        AmountMetrics m = new AmountMetrics();
        BigDecimal claimAmt = currentClaim.getClaimAmount() != null ? currentClaim.getClaimAmount() : BigDecimal.ZERO;
        BigDecimal coverage = policy.getCoverageAmount() != null && policy.getCoverageAmount().compareTo(BigDecimal.ZERO) > 0
                ? policy.getCoverageAmount()
                : BigDecimal.valueOf(1);

        double ratio = claimAmt.divide(coverage, 4, RoundingMode.HALF_UP).doubleValue();
        m.coverageRatio = Math.round(ratio * 1000.0) / 10.0; // Percentage, e.g. 75.5%

        double score = 10.0;

        // Coverage utilization ratio scoring
        if (ratio >= 0.95) {
            score += 45.0;
            flags.add("Near-maximum coverage utilization: Claim amount represents " + String.format("%.1f", ratio * 100) + "% of total policy coverage");
        } else if (ratio >= 0.80) {
            score += 30.0;
            flags.add("High coverage ratio: Claim requests " + String.format("%.1f", ratio * 100) + "% of coverage limit");
        } else if (ratio >= 0.50) {
            score += 15.0;
        }

        // Just-below-ceiling threshold anomaly (e.g. 90% - 98% of coverage)
        if (ratio >= 0.90 && ratio < 0.99) {
            score += 10.0;
            flags.add("Threshold anomaly: Claim amount is calibrated just below coverage ceiling");
        }

        // Historical Average Deviation
        if (!priorClaims.isEmpty()) {
            double sum = 0.0;
            int count = 0;
            for (Claim c : priorClaims) {
                if (c.getClaimAmount() != null) {
                    sum += c.getClaimAmount().doubleValue();
                    count++;
                }
            }
            if (count > 0) {
                double avg = sum / count;
                m.historicalAverage = Math.round(avg * 100.0) / 100.0;

                double currentVal = claimAmt.doubleValue();
                if (currentVal > 2.5 * avg && currentVal > 50000.0) {
                    score += 30.0;
                    flags.add("Sudden amount escalation: Current claim (₹" + currentVal + ") is >2.5x customer's historical average (₹" + String.format("%.0f", avg) + ")");
                } else if (currentVal > 1.7 * avg && currentVal > 50000.0) {
                    score += 15.0;
                    flags.add("Amount deviation: Claim is 70%+ above historical average claim amount");
                }
            }
        }

        m.score = Math.min(100.0, Math.max(0.0, Math.round(score * 10.0) / 10.0));
        return m;
    }

    // ─── 3. Time Patterns ────────────────────────────────────────────────────────

    private static class TimeMetrics {
        double score;
        Long daysSinceStart;
        Long daysToExpiry;
        Long reportingLag;
    }

    private TimeMetrics evaluateTimePatterns(List<Claim> priorClaims, Claim currentClaim, Policy policy, List<String> flags) {
        TimeMetrics m = new TimeMetrics();
        double score = 10.0;

        LocalDate incidentDate = currentClaim.getIncidentDate() != null
                ? currentClaim.getIncidentDate().toLocalDate()
                : LocalDate.now();

        // 1. Early Inception Anomaly (Policy startDate vs IncidentDate)
        if (policy.getStartDate() != null) {
            long daysSinceStart = ChronoUnit.DAYS.between(policy.getStartDate(), incidentDate);
            m.daysSinceStart = daysSinceStart;

            if (daysSinceStart < 0) {
                score += 55.0;
                flags.add("Pre-policy incident anomaly: Incident date (" + incidentDate + ") occurs before policy start date (" + policy.getStartDate() + ")");
            } else if (daysSinceStart <= 15) {
                score += 45.0;
                flags.add("Early claim alert: Claim occurred only " + daysSinceStart + " days after policy inception (high-risk inception window)");
            } else if (daysSinceStart <= 30) {
                score += 25.0;
                flags.add("First-month inception claim: Incident occurred within 30 days of policy start");
            }
        }

        // 2. Impending Expiry Anomaly (IncidentDate vs Policy endDate)
        if (policy.getEndDate() != null) {
            long daysToExpiry = ChronoUnit.DAYS.between(incidentDate, policy.getEndDate());
            m.daysToExpiry = daysToExpiry;

            if (daysToExpiry < 0) {
                score += 50.0;
                flags.add("Post-expiry anomaly: Incident occurred after policy expiration date (" + policy.getEndDate() + ")");
            } else if (daysToExpiry <= 14) {
                score += 25.0;
                flags.add("Near-expiry claim alert: Incident occurred within 14 days of policy expiration");
            }
        }

        // 3. Reporting Lag (Incident Date vs Current System Date)
        long reportingLag = ChronoUnit.DAYS.between(incidentDate, LocalDate.now());
        m.reportingLag = reportingLag;

        if (reportingLag < 0) {
            score += 50.0;
            flags.add("Date integrity anomaly: Incident date is in the future");
        } else if (reportingLag > 90) {
            score += 20.0;
            flags.add("Delayed reporting: Claim filed " + reportingLag + " days after the incident date");
        }

        // 4. Clustered Prior Claims (Incidents within 14 days of each other)
        for (Claim c : priorClaims) {
            if (c.getIncidentDate() != null) {
                long daysDiff = Math.abs(ChronoUnit.DAYS.between(c.getIncidentDate().toLocalDate(), incidentDate));
                if (daysDiff <= 14) {
                    score += 20.0;
                    flags.add("Clustered incidents: Another claim occurred within " + daysDiff + " days of this incident");
                    break;
                }
            }
        }

        m.score = Math.min(100.0, Math.max(0.0, Math.round(score * 10.0) / 10.0));
        return m;
    }

    // ─── 4. Treatment / Incident Type Patterns ───────────────────────────────────

    private static class TreatmentMetrics {
        double score;
    }

    private TreatmentMetrics evaluateTreatmentPatterns(List<Claim> priorClaims, Claim currentClaim, Policy policy, List<String> flags) {
        TreatmentMetrics m = new TreatmentMetrics();
        double score = 10.0;
        String desc = currentClaim.getDescription() != null ? currentClaim.getDescription().toLowerCase() : "";
        String policyType = policy.getPolicyType() != null ? policy.getPolicyType().toUpperCase() : "GENERAL";

        // Treatment & Incident Keywords
        Map<String, List<String>> domainKeywords = Map.of(
                "HEALTH", List.of("surgery", "operation", "icu", "emergency", "consultation", "fracture", "therapy", "dental", "cancer", "admission", "diagnostic", "implant", "scan"),
                "AUTO", List.of("collision", "accident", "theft", "bumper", "dent", "windshield", "engine", "tow", "rear-end", "scratch"),
                "HOME", List.of("water", "leak", "fire", "theft", "burglary", "roof", "storm", "flood", "electrical", "pipe"),
                "LIFE", List.of("death", "disability", "terminal", "hospitalization", "trauma")
        );

        List<String> targetKeywords = domainKeywords.getOrDefault(policyType, List.of("damage", "loss", "injury", "theft"));
        List<String> matchedKeywords = new ArrayList<>();
        for (String kw : targetKeywords) {
            if (desc.contains(kw)) {
                matchedKeywords.add(kw);
            }
        }

        // Check if prior claims have repeated exact high-cost treatment/incident keywords
        for (Claim c : priorClaims) {
            String priorDesc = c.getDescription() != null ? c.getDescription().toLowerCase() : "";
            for (String kw : matchedKeywords) {
                // High-cost treatment duplication (e.g. repeated surgery or repeated theft)
                if (priorDesc.contains(kw) && (kw.equals("surgery") || kw.equals("theft") || kw.equals("fire") || kw.equals("accident") || kw.equals("implant"))) {
                    score += 30.0;
                    flags.add("Repetitive high-severity pattern: Customer has prior claim mentioning '" + kw + "'");
                    break;
                }
            }
        }

        // Cross-domain mismatch check (e.g., auto accident claimed under health policy or vice-versa)
        if ("HEALTH".equals(policyType) && (desc.contains("car accident") || desc.contains("bumper") || desc.contains("collision") || desc.contains("vehicle"))) {
            score += 15.0;
            flags.add("Potential third-party liability: Auto/vehicle collision referenced in Health policy claim");
        }

        m.score = Math.min(100.0, Math.max(0.0, Math.round(score * 10.0) / 10.0));
        return m;
    }
}
