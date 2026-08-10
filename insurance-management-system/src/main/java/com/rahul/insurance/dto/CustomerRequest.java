package com.rahul.insurance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * DTO for creating or updating a Customer.
 * Used as the request body for POST /api/customers.
 * Separating the DTO from the Entity is a best practice:
 * it prevents over-posting attacks and decouples the API contract from the DB schema.
 */
@Data
public class CustomerRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @Email(message = "Invalid email address")
    @NotBlank(message = "Email is required")
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be exactly 10 digits")
    @NotBlank(message = "Phone is required")
    private String phone;

    private String address;
}
