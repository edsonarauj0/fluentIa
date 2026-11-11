import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardPage } from '@/features/challenge/dashboard-page'
import { MySubjectsPage } from '@/features/subjects/my-subjects-page'
import { SubjectDetailPage } from '@/features/subjects/subject-detail-page'
import { CreateSubjectWizardPage } from '@/features/subjects/create-subject-wizard'
import { AuthProvider } from '@/features/auth/auth-context'
import { INITIAL_SUBJECTS, useSubjectsStore } from '@/stores/subjects-store'
import { aiService, buildExpertSystemInstruction } from '@/services/ai-service'

beforeEach(() => {
  localStorage.clear()
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
  useSubjectsStore.setState({
    subjects: INITIAL_SUBJECTS,
    isSelectorOpen: false,
  })
})

afterEach(() => {
  localStorage.clear()
})

describe('Subjects system flow', () => {
  it('opens the subject selector sheet from the Home chip and switches active subject', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const chip = await screen.findByRole('button', { name: /Selecionar assunto/i })
    expect(chip).toHaveTextContent(/Entrevista de tecnologia/i)

    await user.click(chip)

    expect(await screen.findByText(/Seus assuntos/i)).toBeInTheDocument()
    expect(screen.getByText(/1 ativo · 2 pausados · até 5 guardados/i)).toBeInTheDocument()
    expect(screen.getByText(/Viagem para os EUA/i)).toBeInTheDocument()

    const resumeButtons = screen.getAllByRole('button', { name: /Retomar/i })
    await user.click(resumeButtons[0])

    expect(useSubjectsStore.getState().getActiveSubject().id).toBe('viagem-eua')
  })

  it('renders Meus assuntos with active, paused, and archived sections', () => {
    render(
      <MemoryRouter>
        <MySubjectsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Meus assuntos/i)).toBeInTheDocument()
    expect(screen.getByText(/Um ativo por vez\. Você tem 3 de 5\./i)).toBeInTheDocument()
    expect(screen.getByText(/Entrevista de tecnologia/i)).toBeInTheDocument()
    expect(screen.getByText(/5 de 14 lições/i)).toBeInTheDocument()
    expect(screen.getByText(/PAUSADOS · 2/i)).toBeInTheDocument()
    expect(screen.getByText(/ARQUIVADOS · 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Inglês para reuniões/i)).toBeInTheDocument()
  })

  it('renders Detalhe do assunto with track lessons and configuration controls', () => {
    render(
      <MemoryRouter initialEntries={['/subjects/entrevista-tech']}>
        <Routes>
          <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Entrevista de tecnologia/i)).toBeInTheDocument()
    expect(screen.getByText(/4 lições feitas/i)).toBeInTheDocument()
    expect(screen.getByText(/Falando do seu último projeto/i)).toBeInTheDocument()
    expect(screen.getByText(/Trabalho em equipe/i)).toBeInTheDocument()
    expect(screen.getByText(/Explicando decisões técnicas/i)).toBeInTheDocument()
    expect(screen.getByText(/CONFIGURAR ESTE ASSUNTO/i)).toBeInTheDocument()
    expect(screen.getByText(/Mudanças valem para as próximas lições\./i)).toBeInTheDocument()
  })

  it('walks through the Create Subject Wizard from Step 1 to Step 3 preview and creates a subject', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/subjects/new']}>
        <Routes>
          <Route path="/subjects/new" element={<CreateSubjectWizardPage />} />
          <Route path="/" element={<div>Home destination</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/Sobre o que você quer treinar\?/i)).toBeInTheDocument()
    expect(screen.getByText(/\/300/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /CONTINUAR/i }))

    expect(await screen.findByText(/Qual seu ritmo para esse assunto\?/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /VER PRÉVIA/i }))

    expect(await screen.findByText(/Olha o que o Mico montou/i)).toBeInTheDocument()
    expect(screen.getByText(/CENÁRIOS DO CHAT/i)).toBeInTheDocument()
    expect(screen.getByText(/PALAVRAS-CHAVE · 8 DE 30/i)).toBeInTheDocument()
    expect(screen.getByText('deploy')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /CRIAR ASSUNTO/i }))
    expect(await screen.findByText(/Home destination/i)).toBeInTheDocument()
  })

  it('builds an ultra-specialized professor system instruction and generates subject blueprints', async () => {
    const instruction = buildExpertSystemInstruction(
      'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
      'Staff Software Engineer & Tech Hiring Manager (FAANG / Vale do Silício)',
      'Formal',
    )

    expect(instruction).toContain('professor de inglês de elite e mentor sênior')
    expect(instruction).toContain('Staff Software Engineer & Tech Hiring Manager')
    expect(instruction).toContain('entrevista para dev backend')

    const blueprint = await aiService.generateSubjectBlueprint({
      prompt: 'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
      level: 'intermediate',
      durationMinutes: 8,
      trackType: 'goal',
      tone: 'Formal',
    })

    expect(blueprint.draft.title).toBeTruthy()
    expect(blueprint.draft.expertPersona).toBeTruthy()
    expect(blueprint.draft.lessons.length).toBeGreaterThan(0)
    expect(blueprint.draft.keywords.length).toBeGreaterThan(0)
  })

  it('persists subject preferences and values to the user database profile when configured', async () => {
    await useSubjectsStore.getState().syncWithDatabase('demo-user')

    useSubjectsStore.getState().updateSubjectConfig('entrevista-tech', {
      level: 'advanced',
      durationMinutes: 12,
      chatMode: 'always',
    })

    const updatedSubject = useSubjectsStore
      .getState()
      .subjects.find((s) => s.id === 'entrevista-tech')

    expect(updatedSubject?.level).toBe('advanced')
    expect(updatedSubject?.durationMinutes).toBe(12)
    expect(updatedSubject?.chatMode).toBe('always')

    const storedUsers = JSON.parse(localStorage.getItem('sem-mico.users') ?? '[]')
    const demoUser = storedUsers.find((u: { id: string }) => u.id === 'demo-user')
    expect(demoUser?.activeSubjectId).toBe('entrevista-tech')
    expect(demoUser?.preferences?.level).toBe('advanced')
    expect(demoUser?.preferences?.dailyGoalMinutes).toBe(12)
    expect(demoUser?.subjects?.find((s: { id: string }) => s.id === 'entrevista-tech')?.chatMode).toBe('always')
  })
})
