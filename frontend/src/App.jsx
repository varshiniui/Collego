import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/shared/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentProfile from "./pages/student/StudentProfile";
import Documents from "./pages/student/Documents";
import Applications from "./pages/student/Applications";
import Recommendations from "./pages/student/Recommendations";
import CollegeSearch from "./pages/student/CollegeSearch";
import Chatbot from "./pages/student/Chatbot";
import SavedColleges from "./pages/student/SavedColleges";
import StudentMessages from "./pages/student/StudentMessages";
import Scholarships from "./pages/student/Scholarships";
import LearningPath from "./pages/student/LearningPath";
import EligibilityCheck from "./pages/student/EligibilityCheck";

import CounselorDashboard from "./pages/counselor/CounselorDashboard";
import CounselorStudents from "./pages/counselor/CounselorStudents";
import CounselorStudentDetail from "./pages/counselor/CounselorStudentDetail";
import CounselorMessages from "./pages/counselor/CounselorMessages";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminColleges from "./pages/admin/AdminColleges";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminCounselors from "./pages/admin/AdminCounselors";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAISettings from "./pages/admin/AdminAISettings";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivityLog from "./pages/admin/AdminActivityLog";

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/app" element={<RoleRedirect />} />

      {/* Student routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/profile" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>
      } />
      <Route path="/student/documents" element={
        <ProtectedRoute allowedRoles={["student"]}><Documents /></ProtectedRoute>
      } />
      <Route path="/student/recommendations" element={
        <ProtectedRoute allowedRoles={["student"]}><Recommendations /></ProtectedRoute>
      } />
      <Route path="/student/applications" element={
        <ProtectedRoute allowedRoles={["student"]}><Applications /></ProtectedRoute>
      } />
      <Route path="/student/search" element={
        <ProtectedRoute allowedRoles={["student"]}><CollegeSearch /></ProtectedRoute>
      } />
      <Route path="/student/chatbot" element={
        <ProtectedRoute allowedRoles={["student"]}><Chatbot /></ProtectedRoute>
      } />
      <Route path="/student/saved" element={
        <ProtectedRoute allowedRoles={["student"]}><SavedColleges /></ProtectedRoute>
      } />
      <Route path="/student/messages" element={
        <ProtectedRoute allowedRoles={["student"]}><StudentMessages /></ProtectedRoute>
      } />
      <Route path="/student/scholarships" element={
        <ProtectedRoute allowedRoles={["student"]}><Scholarships /></ProtectedRoute>
      } />
      <Route path="/student/learning-path" element={
        <ProtectedRoute allowedRoles={["student"]}><LearningPath /></ProtectedRoute>
      } />
      <Route path="/student/eligibility" element={
        <ProtectedRoute allowedRoles={["student"]}><EligibilityCheck /></ProtectedRoute>
      } />

      {/* Counselor routes */}
      <Route path="/counselor/dashboard" element={
        <ProtectedRoute allowedRoles={["counselor"]}><CounselorDashboard /></ProtectedRoute>
      } />
      <Route path="/counselor/students" element={
        <ProtectedRoute allowedRoles={["counselor"]}><CounselorStudents /></ProtectedRoute>
      } />
      <Route path="/counselor/students/:studentId" element={
        <ProtectedRoute allowedRoles={["counselor"]}><CounselorStudentDetail /></ProtectedRoute>
      } />
      <Route path="/counselor/messages" element={
        <ProtectedRoute allowedRoles={["counselor"]}><CounselorMessages /></ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/colleges" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminColleges /></ProtectedRoute>
      } />
      <Route path="/admin/courses" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminCourses /></ProtectedRoute>
      } />
      <Route path="/admin/students" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminStudents /></ProtectedRoute>
      } />
      <Route path="/admin/counselors" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminCounselors /></ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>
      } />
      <Route path="/admin/ai-settings" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminAISettings /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminSettings /></ProtectedRoute>
      } />
      <Route path="/admin/activity-log" element={
        <ProtectedRoute allowedRoles={["admin"]}><AdminActivityLog /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}