import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/features/auth/auth-context'
import { router } from '@/app/router'

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: 'font-sans rounded-2xl',
        }}
      />
    </AuthProvider>
  )
}
