import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/features/auth/protected-route'
import { AuthPage } from '@/features/auth/auth-page'
import { DashboardPage } from '@/features/challenge/dashboard-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { MySubjectsPage } from '@/features/subjects/my-subjects-page'
import { SubjectDetailPage } from '@/features/subjects/subject-detail-page'
import { CreateSubjectWizardPage } from '@/features/subjects/create-subject-wizard'

const protectedLayout = (
  <ProtectedRoute>
    <AppShell>
      <Outlet />
    </AppShell>
  </ProtectedRoute>
)

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: protectedLayout,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'subjects', element: <MySubjectsPage /> },
      { path: 'subjects/new', element: <CreateSubjectWizardPage /> },
      { path: 'subjects/:subjectId', element: <SubjectDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
