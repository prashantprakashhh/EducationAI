package com.eduai.auth;

import com.eduai.model.User;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Custom annotation to enforce role-based authorization on GraphQL resolver methods.
 * Usage: @RequireRole({User.Role.ADMIN, User.Role.TEACHER})
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    User.Role[] value();
}
