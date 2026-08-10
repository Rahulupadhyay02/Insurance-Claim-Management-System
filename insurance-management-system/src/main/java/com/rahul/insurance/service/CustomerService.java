package com.rahul.insurance.service;

import com.rahul.insurance.dto.CustomerRequest;
import com.rahul.insurance.entity.Customer;
import com.rahul.insurance.exception.BusinessException;
import com.rahul.insurance.exception.ResourceNotFoundException;
import com.rahul.insurance.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer for Customer business logic.
 *
 * Rules enforced here:
 * - Email must be unique across all customers
 * - Customer must exist before being referenced by a Policy
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    /**
     * Create a new customer after validating email uniqueness.
     */
    public Customer createCustomer(CustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                "A customer with email '" + request.getEmail() + "' already exists"
            );
        }

        Customer customer = Customer.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .address(request.getAddress())
            .build();

        Customer saved = customerRepository.save(customer);
        log.info("Created customer id={}, email={}", saved.getId(), saved.getEmail());
        return saved;
    }

    /**
     * Retrieve all customers.
     */
    @Transactional(readOnly = true)
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    /**
     * Retrieve a single customer by ID, or throw 404.
     */
    @Transactional(readOnly = true)
    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    /**
     * Update an existing customer's details.
     */
    public Customer updateCustomer(Long id, CustomerRequest request) {
        Customer customer = getCustomerById(id);

        // Allow email update only if the new email is not taken by another customer
        if (!customer.getEmail().equals(request.getEmail())
            && customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                "Email '" + request.getEmail() + "' is already in use"
            );
        }

        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setEmail(request.getEmail());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());

        return customerRepository.save(customer);
    }

    /**
     * Delete a customer by ID.
     */
    public void deleteCustomer(Long id) {
        Customer customer = getCustomerById(id);
        customerRepository.delete(customer);
        log.info("Deleted customer id={}", id);
    }
}
