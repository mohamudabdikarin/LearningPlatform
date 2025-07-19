package com.mycourse.elearningplatform.service;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;

@Service
public class EmailValidationService {

    // Trusted email providers
    private static final List<String> TRUSTED_PROVIDERS = Arrays.asList(
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com",
        "protonmail.com", "zoho.com", "mail.com", "gmx.com", "yandex.com", "live.com",
        "msn.com", "me.com", "mac.com", "fastmail.com", "tutanota.com", "hey.com"
    );

    // Disposable/temporary email providers to block
    private static final List<String> DISPOSABLE_PROVIDERS = Arrays.asList(
        "10minutemail.com", "tempmail.org", "guerrillamail.com", "mailinator.com",
        "throwaway.email", "temp-mail.org", "sharklasers.com", "guerrillamailblock.com",
        "pokemail.net", "spam4.me", "bccto.me", "chacuo.net", "dispostable.com",
        "fakeinbox.com", "fakeinbox.net", "getairmail.com", "getnada.com", "inbox.si",
        "mailnesia.com", "mintemail.com", "mohmal.com", "nwytg.net", "sharklasers.com",
        "spamspot.com", "spam.la", "tempr.email", "tmpeml.com", "trashmail.com",
        "yopmail.com", "yopmail.net", "yopmail.org", "cool.fr.nf", "jetable.fr.nf",
        "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr", "courriel.fr.nf",
        "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf", "test.com", "example.com",
        "test.org", "example.org", "test.net", "example.net", "sss.com", "aaa.com",
        "fake.com", "fake.org", "fake.net", "temp.com", "temp.org", "temp.net"
    );

    public EmailValidationResult validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return new EmailValidationResult(false, "Email is required");
        }

        // Basic email format validation
        if (!email.matches("^[^@]+@[^@]+\\.[^@]+$")) {
            return new EmailValidationResult(false, "Invalid email format");
        }

        String domain = email.substring(email.indexOf('@') + 1).toLowerCase();

        // Check for disposable emails
        if (DISPOSABLE_PROVIDERS.stream().anyMatch(domain::contains)) {
            return new EmailValidationResult(false, "Temporary or disposable email addresses are not allowed");
        }

        // Check for trusted providers
        if (TRUSTED_PROVIDERS.stream().anyMatch(domain::endsWith)) {
            return new EmailValidationResult(true, "Valid email");
        }

        // For other domains, allow but flag for review
        return new EmailValidationResult(true, "Email accepted but domain may need review");
    }

    public static class EmailValidationResult {
        private final boolean valid;
        private final String message;

        public EmailValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
} 