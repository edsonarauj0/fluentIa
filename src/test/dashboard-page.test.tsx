import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '@/features/challenge/dashboard-page'
import { AuthProvider } from '@/features/auth/auth-context'

beforeEach(() => {
  localStorage.setItem(
    'fluentia.users',
    JSON.stringify([
      {
        id: 'demo-user',
        name: 'Edson',
        email: 'edson@example.com',
        password: '123456',
        preferences: {
          category: 'News',
          level: 'beginner',
          theme: 'sunrise',
          maxCharacters: 450,
        },
        streak: 3,
        completedChallengeIds: [],
        lastCompletedAt: null,
      },
    ]),
  )
  localStorage.setItem('fluentia.session', JSON.stringify('demo-user'))
})

afterEach(() => {
  localStorage.clear()
})

describe('DashboardPage', () => {
  it('renders challenge area for authenticated users', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Seu desafio de hoje/i)).toBeInTheDocument()
    expect(await screen.findByText(/Marcar como concluido/i)).toBeInTheDocument()
  })
})
