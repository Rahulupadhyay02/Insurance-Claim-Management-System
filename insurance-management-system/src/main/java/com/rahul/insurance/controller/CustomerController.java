package com.rahul.insurance.controller;

import com.rahul.insurance.dto.CustomerRequest;
import com.rahul.insurance.entity.Customer;
import com.rahul.insurance.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Customer management.
 *
 * Endpoints:
 *   POST   /api/customers          - Create a customer
 *   GET    /api/customers          - List all customers
 *   GET    /api/customers/{id}     - Get one customer
 *   PUT    /api/customers/{id}     - Update a customer
 *   DELETE /api/customers/{id}     - Delete a customer
 *
 * The controller is thin — it only handles HTTP concerns (status codes, request parsing).
 * All business logic lives in CustomerService.
 */
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow React frontend on a different port
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@Valid @RequestBody CustomerRequest request) {
        Customer customer = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(customer);
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(
        @PathVariable Long id,
        @Valid @RequestBody CustomerRequest request
    ) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }
}
