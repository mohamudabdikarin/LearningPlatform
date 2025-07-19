package com.mycourse.elearningplatform.repository;

import com.mycourse.elearningplatform.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    long countByRoles_Name(String roleName);

    java.util.List<User> findAllByRoles_Name(String roleName);

    Optional<User> findByResetToken(String resetToken);

    Optional<User> findByVerificationCode(String verificationCode);

        // Update reset token
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.resetToken = :resetToken, u.resetTokenExpiry = :resetTokenExpiry WHERE u.id = :userId")
    void updateResetToken(@Param("userId") Long userId, @Param("resetToken") String resetToken, @Param("resetTokenExpiry") LocalDateTime resetTokenExpiry);
    
    // Update password and reset token
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.password = :password, u.resetToken = :resetToken, u.resetTokenExpiry = :resetTokenExpiry WHERE u.id = :userId")
    void updatePasswordAndResetToken(@Param("userId") Long userId, @Param("password") String password, @Param("resetToken") String resetToken, @Param("resetTokenExpiry") LocalDateTime resetTokenExpiry);
    
    // Update email verification
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.emailVerified = :emailVerified, u.verificationCode = :verificationCode, u.verificationCodeExpiry = :verificationCodeExpiry WHERE u.id = :userId")
    void updateEmailVerification(@Param("userId") Long userId, @Param("emailVerified") boolean emailVerified, @Param("verificationCode") String verificationCode, @Param("verificationCodeExpiry") LocalDateTime verificationCodeExpiry);

}
