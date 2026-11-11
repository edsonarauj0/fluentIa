import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { DashboardPage } from '@/features/challenge/dashboard-page'
import { AuthProvider } from '@/features/auth/auth-context'

beforeEach(() => {
  localStorage.setItem(
    'sem-mico.users',
    JSON.stringify([
      {
        id: 'demo-user',
        name: 'Edson',
        email: 'edson@example.com',
        password: '123456',
        preferences: {
          category: 'Poema',
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
  localStorage.setItem('sem-mico.session', JSON.stringify('demo-user'))
})

afterEach(() => {
  localStorage.clear()
})

describe('DashboardPage', () => {
  it('renders challenge area and gamified home structure for authenticated users', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Bora, Edson\?/i)).toBeInTheDocument()
    expect(await screen.findByText(/MISSÃO DO DIA/i)).toBeInTheDocument()
    expect(await screen.findByText(/COMEÇAR MISSÃO/i)).toBeInTheDocument()
    expect(await screen.findByText(/Meta de hoje/i)).toBeInTheDocument()
    expect(await screen.findByText(/Quer ir mais fundo\?/i)).toBeInTheDocument()
    expect(await screen.findByText(/Seu desafio de hoje/i)).toBeInTheDocument()
    expect(await screen.findByText(/Marcar como concluido/i)).toBeInTheDocument()
  })
})
