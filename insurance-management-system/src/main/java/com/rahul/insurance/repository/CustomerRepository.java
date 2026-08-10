package com.rahul.insurance.repository;

import com.rahul.insurance.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Customer CRUD operations.
 * Spring Data JPA generates the SQL automatically.
 */
@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // Find a customer by email (used to check for duplicates)
    Optional<Customer> findByEmail(String email);

    // Check if an email already exists
    boolean existsByEmail(String email);
}
