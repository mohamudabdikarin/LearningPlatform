package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    long countByRoles_Name(String roleName);
    java.util.List<User> findAllByRoles_Name(String roleName);
}