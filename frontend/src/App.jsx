import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CoursesListPage from './pages/CoursesListPage';
// import CoursesPage from './pages/CoursesPage';
import DashboardPage from './pages/DashboardPage';
// import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
// ProfilePage removed - using StudentProfilePage in dashboard instead
import TeacherCoursesPage from './pages/TeacherCoursesPage';
import EnrolledCoursesPage from './pages/EnrolledCoursesPage';
import QuizPage from './pages/QuizPage';
import TeacherDashboardLayout from './components/TeacherDashboardLayout';
import TeacherDashboardOverview from './pages/TeacherDashboardOverview';
import TeacherResourceUploadPage from './pages/TeacherResourceUploadPage';
import TeacherEnrolledStudentsPage from './pages/TeacherEnrolledStudentsPage';
import TeacherProgressPage from './pages/TeacherProgressPage';
import StudentDashboardLayout from './components/StudentDashboardLayout';
import StudentDashboardOverview from './pages/StudentDashboardOverview';
import StudentCoursesPage from './pages/StudentCoursesPage';
import CourseViewerPage from './pages/CourseViewerPage';
import StudentProgressPage from './pages/StudentProgressPage';
import StudentProfilePage from './pages/StudentProfilePage';
import PaymentPage from './pages/PaymentPage';
import EnrollPage from './pages/EnrollPage';

function App() {
  return (
    <Router>
      <div className="bg-light-gray min-h-screen">

        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/courses" element={<CoursesListPage />} />
            <Route path="/courses/:courseId" element={<CourseViewerPage />} />
            {/* Profile route removed - use /dashboard/student/profile instead */}
            <Route path="/my-courses" element={<TeacherCoursesPage />} />
            <Route path="/enrollments" element={<EnrolledCoursesPage />} />
            <Route path="/enroll/:courseId" element={<EnrollPage />} />
            <Route path="/payment/:courseId" element={<PaymentPage />} />


        

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              {/* Teacher Dashboard Nested Routes */}
              <Route path="/dashboard/teacher" element={<TeacherDashboardLayout />}>
                <Route index element={<TeacherDashboardOverview />} />
                <Route path="courses" element={<TeacherCoursesPage />} />
                <Route path="resources" element={<TeacherResourceUploadPage />} />
                <Route path="enrollments" element={<TeacherEnrolledStudentsPage />} />
                <Route path="progress" element={<TeacherProgressPage />} />
              </Route>
              {/* Student Dashboard Routes */}
              <Route path="/dashboard/student" element={<StudentDashboardLayout />}>
                <Route index element={<StudentDashboardOverview />} />
                <Route path="courses" element={<StudentCoursesPage />} />
                <Route path="course/:courseId" element={<CourseViewerPage />} />
                <Route path="course/:courseId/resources" element={<CourseViewerPage />} />
                <Route path="progress" element={<StudentProgressPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
              </Route>
            </Route>

          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;