package com.eduai.auth;

import com.eduai.model.User;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * AOP aspect that intercepts methods annotated with @RequireRole
 * and verifies the authenticated user has the required role.
 */
@Aspect
@Component
@Slf4j
public class RoleAuthorizationAspect {

    @Around("@annotation(requireRole)")
    public Object checkRole(ProceedingJoinPoint joinPoint, RequireRole requireRole) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getPrincipal().equals("anonymousUser")) {
            throw new AccessDeniedException("Authentication required. Please log in.");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User user)) {
            throw new AccessDeniedException("Invalid authentication state.");
        }

        User.Role[] allowedRoles = requireRole.value();
        boolean hasRole = Arrays.asList(allowedRoles).contains(user.getRole());

        if (!hasRole) {
            log.warn("Access denied for user '{}' with role '{}'. Required roles: {}",
                    user.getUsername(), user.getRole(), Arrays.toString(allowedRoles));
            throw new AccessDeniedException(
                    "Access denied. Required role: " + Arrays.toString(allowedRoles));
        }

        log.debug("Access granted for user '{}' with role '{}'", user.getUsername(), user.getRole());
        return joinPoint.proceed();
    }
}
