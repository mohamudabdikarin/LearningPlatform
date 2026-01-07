package com.mycourse.elearningplatform.service;

import com.mycourse.elearningplatform.model.*;
import com.mycourse.elearningplatform.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Mock Data Service for Portfolio Demo
 * Creates realistic demo data for showcasing the e-learning platform
 */
@Service
public class MockDataService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private CourseRepository courseRepository;
    @Autowired private EnrollmentRepository enrollmentRepository;
    @Autowired private CourseRatingRepository courseRatingRepository;
    @Autowired private ResourceRepository resourceRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // Demo account credentials
    public static final String DEMO_ADMIN_EMAIL = "admin@demo.com";
    public static final String DEMO_STUDENT_EMAIL = "student@demo.com";
    public static final String DEMO_PASSWORD = "demo123";

    @Transactional
    public void initializeMockData() {
        if (userRepository.count() > 0) {
            return; // Data already exists
        }

        // Create roles
        Role studentRole = createRoleIfNotExists("STUDENT");
        Role teacherRole = createRoleIfNotExists("TEACHER");

        // Create demo accounts
        User adminUser = createDemoAdmin(teacherRole);
        User studentUser = createDemoStudent(studentRole);

        // Create additional teachers
        List<User> teachers = createAdditionalTeachers(teacherRole);
        teachers.add(adminUser);

        // Create additional students
        List<User> students = createAdditionalStudents(studentRole);
        students.add(studentUser);

        // Create courses
        List<Course> courses = createMockCourses(teachers);

        // Create enrollments with progress
        createMockEnrollments(students, courses);

        // Create course ratings
        createMockRatings(students, courses);

        // Create resources
        createMockResources(courses);
    }

    private Role createRoleIfNotExists(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(roleName);
                    return roleRepository.save(role);
                });
    }

    private User createDemoAdmin(Role teacherRole) {
        User admin = new User("Demo", "Admin", DEMO_ADMIN_EMAIL, passwordEncoder.encode(DEMO_PASSWORD));
        admin.setEmailVerified(true);
        admin.setBio("Experienced educator and course creator with 10+ years in online learning.");
        admin.setPhone("+1-555-0101");
        admin.setAddress("San Francisco, CA");
        admin.setRoles(Set.of(teacherRole));
        admin.setInterests(Set.of("Education Technology", "Course Design", "Student Engagement"));
        return userRepository.save(admin);
    }

    private User createDemoStudent(Role studentRole) {
        User student = new User("Demo", "Student", DEMO_STUDENT_EMAIL, passwordEncoder.encode(DEMO_PASSWORD));
        student.setEmailVerified(true);
        student.setBio("Passionate learner exploring new technologies and skills.");
        student.setPhone("+1-555-0102");
        student.setAddress("New York, NY");
        student.setRoles(Set.of(studentRole));
        student.setInterests(Set.of("Web Development", "Data Science", "Mobile Apps", "UI/UX Design"));
        return userRepository.save(student);
    }

    private List<User> createAdditionalTeachers(Role teacherRole) {
        List<User> teachers = new ArrayList<>();
        
        String[][] teacherData = {
            {"Sarah", "Johnson", "sarah.johnson@demo.com", "Full-stack developer and instructor with expertise in React and Node.js", "Web Development, JavaScript, React"},
            {"Michael", "Chen", "michael.chen@demo.com", "Data scientist and AI researcher with 8 years of industry experience", "Data Science, Machine Learning, Python"},
            {"Emily", "Rodriguez", "emily.rodriguez@demo.com", "UX/UI designer and design thinking facilitator", "Design, User Experience, Figma"},
            {"David", "Thompson", "david.thompson@demo.com", "Mobile app developer specializing in React Native and Flutter", "Mobile Development, React Native, Flutter"},
            {"Lisa", "Wang", "lisa.wang@demo.com", "DevOps engineer and cloud architecture specialist", "DevOps, AWS, Docker, Kubernetes"}
        };

        for (String[] data : teacherData) {
            User teacher = new User(data[0], data[1], data[2], passwordEncoder.encode(DEMO_PASSWORD));
            teacher.setEmailVerified(true);
            teacher.setBio(data[3]);
            teacher.setPhone("+1-555-" + String.format("%04d", 200 + teachers.size()));
            teacher.setRoles(Set.of(teacherRole));
            teacher.setInterests(Set.of(data[4].split(", ")));
            teachers.add(userRepository.save(teacher));
        }
        
        return teachers;
    }

    private List<User> createAdditionalStudents(Role studentRole) {
        List<User> students = new ArrayList<>();
        
        String[][] studentData = {
            {"Alex", "Martinez", "alex.martinez@demo.com", "Computer science student interested in full-stack development"},
            {"Jessica", "Brown", "jessica.brown@demo.com", "Marketing professional transitioning to data analytics"},
            {"Ryan", "Davis", "ryan.davis@demo.com", "Graphic designer learning web development"},
            {"Sophia", "Wilson", "sophia.wilson@demo.com", "Recent graduate exploring mobile app development"},
            {"James", "Taylor", "james.taylor@demo.com", "Entrepreneur learning about digital marketing and e-commerce"},
            {"Emma", "Anderson", "emma.anderson@demo.com", "Teacher interested in educational technology"},
            {"Noah", "Thomas", "noah.thomas@demo.com", "Engineering student learning data science"},
            {"Olivia", "Jackson", "olivia.jackson@demo.com", "Designer exploring UX/UI principles"},
            {"William", "White", "william.white@demo.com", "Business analyst learning Python programming"},
            {"Ava", "Harris", "ava.harris@demo.com", "Content creator interested in video editing and design"}
        };

        for (int i = 0; i < studentData.length; i++) {
            String[] data = studentData[i];
            User student = new User(data[0], data[1], data[2], passwordEncoder.encode(DEMO_PASSWORD));
            student.setEmailVerified(true);
            student.setBio(data[3]);
            student.setPhone("+1-555-" + String.format("%04d", 300 + i));
            student.setRoles(Set.of(studentRole));
            students.add(userRepository.save(student));
        }
        
        return students;
    }

    private List<Course> createMockCourses(List<User> teachers) {
        List<Course> courses = new ArrayList<>();
        
        Object[][] courseData = {
            // {title, description, price, discountPrice, duration, level, instructor_index, learningObjectives, requirements, targetAudience}
            {"Complete React Development Bootcamp", "Master React from basics to advanced concepts including hooks, context, and state management", 
             new BigDecimal("199.99"), new BigDecimal("149.99"), 40, "Beginner", 1,
             "Build modern React applications\nUnderstand component lifecycle\nMaster hooks and state management\nImplement routing and navigation",
             "Basic HTML, CSS, and JavaScript knowledge\nFamiliarity with ES6+ syntax\nCode editor installed",
             "Aspiring web developers\nJavaScript developers wanting to learn React\nStudents and professionals"},
            
            {"Data Science with Python", "Comprehensive course covering data analysis, visualization, and machine learning with Python", 
             new BigDecimal("249.99"), null, 50, "Intermediate", 2,
             "Analyze data using pandas and numpy\nCreate visualizations with matplotlib and seaborn\nBuild machine learning models\nWork with real-world datasets",
             "Basic Python programming knowledge\nHigh school level mathematics\nJupyter Notebook setup",
             "Data analysts\nPython developers\nBusiness professionals\nStudents in STEM fields"},
            
            {"UI/UX Design Fundamentals", "Learn the principles of user interface and user experience design with hands-on projects", 
             new BigDecimal("179.99"), new BigDecimal("129.99"), 30, "Beginner", 3,
             "Understand design principles and theory\nCreate wireframes and prototypes\nConduct user research\nDesign responsive interfaces",
             "No prior design experience needed\nFigma account (free)\nCreative mindset",
             "Aspiring designers\nDevelopers wanting design skills\nProduct managers\nEntrepreneurs"},
            
            {"Mobile App Development with React Native", "Build cross-platform mobile apps using React Native and JavaScript", 
             new BigDecimal("229.99"), new BigDecimal("179.99"), 45, "Intermediate", 4,
             "Develop iOS and Android apps\nImplement navigation and state management\nIntegrate with APIs\nPublish to app stores",
             "React knowledge required\nJavaScript ES6+ proficiency\nNode.js and npm installed",
             "React developers\nMobile app developers\nFull-stack developers"},
            
            {"DevOps and Cloud Computing", "Master DevOps practices and cloud deployment with AWS, Docker, and Kubernetes", 
             new BigDecimal("299.99"), null, 60, "Advanced", 5,
             "Set up CI/CD pipelines\nDeploy applications to AWS\nManage containers with Docker\nOrchestrate with Kubernetes",
             "Linux command line experience\nBasic networking knowledge\nAWS account (free tier)\nDocker installed",
             "Software developers\nSystem administrators\nDevOps engineers\nCloud architects"},
            
            {"JavaScript Fundamentals", "Complete guide to JavaScript programming from basics to advanced concepts", 
             new BigDecimal("149.99"), new BigDecimal("99.99"), 35, "Beginner", 1,
             "Master JavaScript syntax and concepts\nUnderstand DOM manipulation\nWork with APIs and async programming\nBuild interactive web applications",
             "Basic HTML and CSS knowledge\nCode editor\nWeb browser",
             "Complete beginners\nHTML/CSS developers\nStudents\nCareer changers"},
            
            {"Machine Learning Masterclass", "Deep dive into machine learning algorithms and practical implementations", 
             new BigDecimal("349.99"), new BigDecimal("249.99"), 70, "Advanced", 2,
             "Implement ML algorithms from scratch\nWork with TensorFlow and scikit-learn\nHandle real-world datasets\nDeploy ML models",
             "Strong Python skills\nLinear algebra and statistics\nJupyter Notebook\nMathematical background",
             "Data scientists\nML engineers\nResearchers\nAdvanced Python developers"},
            
            {"Advanced React Patterns", "Learn advanced React patterns, performance optimization, and best practices", 
             new BigDecimal("199.99"), null, 25, "Advanced", 1,
             "Master advanced React patterns\nOptimize application performance\nImplement custom hooks\nBuild scalable applications",
             "Solid React experience\nJavaScript ES6+ mastery\nUnderstanding of React hooks",
             "Experienced React developers\nSenior frontend developers\nTech leads"},
            
            {"Digital Marketing Fundamentals", "Complete guide to digital marketing including SEO, social media, and analytics", 
             new BigDecimal("159.99"), new BigDecimal("119.99"), 25, "Beginner", 0,
             "Develop marketing strategies\nUnderstand SEO and content marketing\nManage social media campaigns\nAnalyze marketing metrics",
             "No prior marketing experience needed\nGoogle Analytics account\nSocial media accounts",
             "Entrepreneurs\nMarketing professionals\nBusiness owners\nStudents"},
            
            {"Flutter Mobile Development", "Build beautiful native mobile apps for iOS and Android using Flutter and Dart", 
             new BigDecimal("219.99"), new BigDecimal("169.99"), 40, "Intermediate", 4,
             "Master Flutter framework\nBuild responsive mobile UIs\nImplement state management\nPublish to app stores",
             "Basic programming knowledge\nDart language basics\nFlutter SDK installed",
             "Mobile developers\nSoftware developers\nApp entrepreneurs\nStudents"},
            
            {"Python for Beginners", "Complete Python programming course for absolute beginners", 
             new BigDecimal("129.99"), new BigDecimal("89.99"), 30, "Beginner", 2,
             "Learn Python syntax and fundamentals\nWork with data structures\nBuild simple applications\nUnderstand object-oriented programming",
             "No programming experience needed\nPython installed\nCode editor",
             "Complete beginners\nStudents\nCareer changers\nProfessionals learning automation"},
            
            {"Advanced CSS and Animations", "Master advanced CSS techniques, animations, and modern layout systems", 
             new BigDecimal("139.99"), null, 20, "Intermediate", 3,
             "Create complex layouts with Grid and Flexbox\nBuild smooth animations\nImplement responsive designs\nOptimize CSS performance",
             "Solid HTML and CSS foundation\nBasic JavaScript knowledge\nCode editor",
             "Frontend developers\nWeb designers\nUI developers"}
        };

        for (Object[] data : courseData) {
            Course course = new Course();
            course.setTitle((String) data[0]);
            course.setDescription((String) data[1]);
            course.setPrice((BigDecimal) data[2]);
            course.setDiscountPrice((BigDecimal) data[3]);
            course.setDiscountActive(data[3] != null);
            course.setDuration((Integer) data[4]);
            course.setLevel((String) data[5]);
            course.setInstructor(teachers.get((Integer) data[6]));
            course.setLearningObjectives((String) data[7]);
            course.setRequirements((String) data[8]);
            course.setTargetAudience((String) data[9]);
            
            // Mock image and video URLs (using placeholder services)
            course.setImageUrl("https://picsum.photos/400/300?random=" + courses.size());
            course.setVideoUrl("https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4");
            
            courses.add(courseRepository.save(course));
        }
        
        return courses;
    }

    private void createMockEnrollments(List<User> students, List<Course> courses) {
        Random random = new Random();
        
        for (User student : students) {
            // Each student enrolls in 2-5 courses
            int numEnrollments = 2 + random.nextInt(4);
            Set<Course> enrolledCourses = new HashSet<>();
            
            while (enrolledCourses.size() < numEnrollments && enrolledCourses.size() < courses.size()) {
                Course course = courses.get(random.nextInt(courses.size()));
                if (!enrolledCourses.contains(course)) {
                    enrolledCourses.add(course);
                    
                    Enrollment enrollment = new Enrollment(student, course);
                    
                    // Set random progress (0%, 25%, 50%, 75%, 100%)
                    int[] progressOptions = {0, 25, 50, 75, 100};
                    enrollment.setProgress(progressOptions[random.nextInt(progressOptions.length)]);
                    
                    // Set enrollment date (last 3 months)
                    enrollment.setEnrolledAt(LocalDateTime.now().minusDays(random.nextInt(90)));
                    
                    // Set last activity (within last 30 days for active courses)
                    if (enrollment.getProgress() > 0) {
                        enrollment.setLastActivityDate(LocalDateTime.now().minusDays(random.nextInt(30)));
                    }
                    
                    // Set quiz scores for completed sections
                    if (enrollment.getProgress() > 25) {
                        enrollment.setAverageQuizScore(70 + random.nextInt(30)); // 70-100%
                    }
                    
                    // Mark some as paid
                    enrollment.setPaid(random.nextBoolean());
                    
                    enrollmentRepository.save(enrollment);
                }
            }
        }
    }

    private void createMockRatings(List<User> students, List<Course> courses) {
        Random random = new Random();
        
        for (Course course : courses) {
            // Get students enrolled in this course
            List<Enrollment> enrollments = enrollmentRepository.findByCourse(course);
            
            for (Enrollment enrollment : enrollments) {
                // Only students with some progress can rate
                if (enrollment.getProgress() > 50 && random.nextBoolean()) {
                    CourseRating rating = new CourseRating();
                    rating.setCourse(course);
                    rating.setUser(enrollment.getUser());
                    
                    // Generate realistic ratings (mostly 4-5 stars)
                    int[] ratingOptions = {3, 4, 4, 4, 5, 5, 5};
                    rating.setRating(ratingOptions[random.nextInt(ratingOptions.length)]);
                    
                    // Add realistic comments
                    String[] comments = {
                        "Excellent course! Very well structured and easy to follow.",
                        "Great instructor and practical examples. Highly recommended!",
                        "Good content but could use more hands-on exercises.",
                        "Perfect for beginners. Clear explanations and good pacing.",
                        "Amazing course! Learned so much and already applying it at work.",
                        "Well organized content with practical projects.",
                        "Instructor is knowledgeable and explains concepts clearly.",
                        "Good value for money. Covers all the essential topics.",
                        "Challenging but rewarding. Great for skill development.",
                        "Comprehensive course with real-world applications."
                    };
                    rating.setComment(comments[random.nextInt(comments.length)]);
                    
                    rating.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(60)));
                    
                    courseRatingRepository.save(rating);
                }
            }
        }
    }

    private void createMockResources(List<Course> courses) {
        Random random = new Random();
        
        String[] resourceTypes = {"PDF", "Video", "Document", "Presentation"};
        String[] resourceNames = {
            "Course Introduction", "Getting Started Guide", "Practice Exercises", 
            "Project Files", "Reference Materials", "Cheat Sheet", "Final Project",
            "Additional Resources", "Bonus Content", "Certificate Template"
        };
        
        for (Course course : courses) {
            // Each course has 3-7 resources
            int numResources = 3 + random.nextInt(5);
            
            for (int i = 0; i < numResources; i++) {
                Resource resource = new Resource();
                resource.setCourse(course);
                resource.setFileName(resourceNames[random.nextInt(resourceNames.length)] + " - " + course.getTitle());
                resource.setFileType(resourceTypes[random.nextInt(resourceTypes.length)]);
                resource.setFileSize((long) (1024 * 1024 * (1 + random.nextInt(10)))); // 1-10 MB
                resource.setFileUrl("https://example.com/resources/" + UUID.randomUUID().toString());
                resource.setCreatedAt(LocalDateTime.now().minusDays(random.nextInt(30)));
                
                resourceRepository.save(resource);
            }
        }
    }

    public Map<String, Object> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses", courseRepository.count());
        stats.put("totalStudents", userRepository.countByRoles_Name("STUDENT"));
        stats.put("totalTeachers", userRepository.countByRoles_Name("TEACHER"));
        stats.put("totalEnrollments", enrollmentRepository.count());
        return stats;
    }
}