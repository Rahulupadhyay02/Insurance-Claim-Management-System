package com.rahul.insurance.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Home controller — provides a friendly root endpoint showing API status.
 */
@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("application", "Insurance Claim Management System");
        response.put("status", "✅ Running");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());

        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("GET  /api/customers",              "List all customers");
        endpoints.put("POST /api/customers",              "Create a customer");
        endpoints.put("GET  /api/customers/{id}",         "Get customer by ID");
        endpoints.put("GET  /api/policies",               "List all policies");
        endpoints.put("POST /api/policies",               "Create a policy");
        endpoints.put("GET  /api/claims",                 "List all claims");
        endpoints.put("POST /api/claims",                 "Submit a claim (AI risk assessment)");
        endpoints.put("PUT  /api/claims/{id}/approve",    "Approve a claim");
        endpoints.put("PUT  /api/claims/{id}/reject",     "Reject a claim");
        endpoints.put("GET  /api/claims/risk/{level}",    "Filter claims by risk: LOW / MEDIUM / HIGH");

        response.put("endpoints", endpoints);
        return ResponseEntity.ok(response);
    }
}
