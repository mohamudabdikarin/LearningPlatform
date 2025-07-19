# LearnEase

## Overview

**LearnEase** is a modern e-learning platform designed to connect students and teachers from anywhere in the world. It lets teachers create and manage courses, upload resources, and track student progress. Students can enroll in courses, watch lectures, complete quizzes, and earn certificates. The platform was built to make online learning simple, engaging, and accessible for everyone.

**Main Features:**
- Student and teacher registration/login
- Browse and enroll in courses
- Video lectures and downloadable resources
- Course ratings and reviews
- Progress tracking and achievements
- Teacher dashboard for course/resource management
- Student dashboard for tracking learning journey

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Spring Boot, Java, Spring Security, JPA/Hibernate
- **Database:** PostgreSQL (hosted on Supabase)
- **Other:** Video.js (video playback), React Router, lucide-react,

---

## Setup Instructions

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **Java** (version 17 or higher)
- **Maven** (for building the backend)
- **PostgreSQL** (local or cloud, e.g., Supabase)

### 1. Clone the Repository

```sh
git clone https://github.com/your-username/learnify.git
cd learnify
```

### 2. Environment Variables

#### Frontend

- Copy `.env.example` to `.env` in the `frontend/` folder if provided.
- Usually, you may need to set the backend API URL (defaults to `http://localhost:8080`).

#### Backend

- Edit `backend/src/main/resources/application.properties` for your PostgreSQL connection.
- Example:
  ```
  spring.datasource.url=jdbc:postgresql://localhost:5432/your_db
  spring.datasource.username=your_user
  spring.datasource.password=your_password
  ```
- You can use the provided Supabase connection or set up your own local database.

### 3. Backend Setup

```sh
cd backend
./mvnw spring-boot:run
```
- The backend will start on [http://localhost:8080] by default.

### 4. Frontend Setup

```sh
cd frontend
npm install
npm run dev
```
- The frontend will start on [http://localhost:5173](http://localhost:5173) (or as shown in your terminal).

### 5. Using the App

- Open your browser and go to [http://localhost:5173](http://localhost:5173)
- Register as a student or teacher and start exploring!

---

## Screenshots

> _Add screenshots here if you have them, e.g.:_
>
> ![Home Page](screenshots/homepage.png)
> ![Teacher Dashboard](screenshots/teacher-dashboard.png)

---

## Folder Structure

```
frontend/
  ├── src/
  │   ├── components/      # Reusable UI components (Navbar, etc.)
  │   ├── context/         # Contexts for Auth, DarkMode
  │   ├── pages/           # Page components (LoginPage, RegisterPage, etc.)
  │   ├── services/        # API service functions
  │   ├── App.jsx          # Main app and routes
  │   └── main.jsx         # Entry point
  ├── public/
  ├── package.json
  ├── tailwind.config.js
  └── vite.config.js
```

- **backend/**: All backend code, API, and database logic.
- **frontend/**: All frontend React code, styles, and assets.

---

## Features

- User authentication (student/teacher roles)
- Course creation, editing, and deletion (teachers)
- Upload and manage course resources (PDFs, videos, etc.)
- Enroll in and track progress for courses (students)
- Video lectures with progress tracking
- Course ratings and reviews
- Achievements and certificates for students
- Dashboards for both students and teachers
- Responsive, modern UI with dark mode

---

## Contact / Author Info

Made with ❤️ by my team.

- GitHub: [your-username](https://github.com/your-username)
- Email: your.email@example.com

Feel free to open issues or reach out if you have questions