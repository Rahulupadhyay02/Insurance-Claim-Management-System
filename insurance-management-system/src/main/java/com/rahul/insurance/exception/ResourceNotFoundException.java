package com.rahul.insurance.exception;

/**
 * Thrown when a requested resource (Customer, Policy, Claim) does not exist.
 * Results in a 404 Not Found HTTP response via GlobalExceptionHandler.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Long id) {
        super(resourceName + " not found with id: " + id);
    }
}
