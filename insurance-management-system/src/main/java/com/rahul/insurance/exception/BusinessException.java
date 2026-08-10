package com.rahul.insurance.exception;

/**
 * Thrown when a business rule is violated.
 * Example: trying to claim against an expired policy,
 * or approving a claim that was already rejected.
 * Results in a 400 Bad Request HTTP response.
 */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
