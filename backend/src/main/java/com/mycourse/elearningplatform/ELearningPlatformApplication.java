package com.mycourse.elearningplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import com.mycourse.elearningplatform.repository.RoleRepository;
import com.mycourse.elearningplatform.model.Role;

@SpringBootApplication
public class ELearningPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(ELearningPlatformApplication.class, args);
	}

	@Bean
	public ApplicationRunner ensureRolesExist(RoleRepository roleRepository) {
		return args -> {
			if (roleRepository.findByName("STUDENT").isEmpty()) {
				roleRepository.save(new Role("STUDENT"));
			}
			if (roleRepository.findByName("TEACHER").isEmpty()) {
				roleRepository.save(new Role("TEACHER"));
			}
		};
	}

}
