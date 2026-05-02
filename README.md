# FluentIA

Aplicacao web para estudo diario de ingles com desafios de leitura, audio e interacao com IA.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Componentes em estilo Shadcn UI (`components.json` + `src/components/ui`)
- React Router
- React Hook Form + Zod
- Jest + Testing Library
- Integracao pronta para Firebase Auth + Firestore
- Integracao pronta para Gemini API

## MVP implementado

- Login e cadastro
- Perfil com categoria, nivel, tema e limite de caracteres
- Geracao de desafio diario
- Leitura do texto na tela
- Audio com Web Speech API
- Destaque da palavra durante a leitura
- Selecao de palavra ou trecho
- Consulta de significado para IA
- Historico basico e streak

## Como rodar

```bash
npm install
npm run dev
```

Para build:

```bash
npm run build
```

Para testes:

```bash
npm test
```

## Variaveis de ambiente

Copie `.env.example` para `.env` e preencha quando quiser sair do modo demo:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

Sem essas chaves, o app funciona em `modo demo` com:

- autenticacao em `localStorage`
- textos fallback
- respostas fallback para selecao de palavras

## Estrutura

```text
src/
  app/               bootstrap e rotas
  components/        layout e UI base
  features/          auth, challenge, profile
  hooks/             Web Speech API
  lib/               constantes, storage e utils
  services/          auth, desafio, Gemini e Firebase
  test/              testes com Jest
  types/             tipos de dominio
firebase/
  firestore.rules    regras iniciais do Firestore
```

## Arquitetura do fluxo

1. O usuario faz login ou cadastro.
2. As preferencias de estudo definem categoria, nivel e limite do texto.
3. `challengeService` cria ou recupera o desafio do dia.
4. `aiService` tenta usar Gemini; se nao houver chave, cai no fallback.
5. O usuario escuta o texto com `speechSynthesis`.
6. O texto destaca a palavra atual enquanto o audio avanca.
7. Ao selecionar um trecho, o app consulta a IA e mostra traducao, contexto e exemplo.
8. Ao concluir o desafio, a streak e o historico sao atualizados.

## Modelo de dados sugerido

As regras iniciais do Firestore estao em [firebase/firestore.rules](/D:/Projetos/FluentIA/firebase/firestore.rules).

Colecoes principais:

- `profiles`
- `dailyChallenges`

## Publicacao

- Frontend: Vercel ou Netlify
- Backend gerenciado: Firebase
- Gemini: use a chave no servidor em uma proxima iteracao para evitar exposicao no cliente

### Deploy na Vercel

1. Envie este projeto para um repositorio no GitHub.
2. No painel da Vercel, clique em `Add New > Project`.
3. Importe o repositorio da FluentIA.
4. Confirme as configuracoes:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Em `Environment Variables`, cadastre:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GEMINI_API_KEY`
6. Clique em `Deploy`.

O arquivo [vercel.json](/D:/Projetos/FluentIA/vercel.json) foi adicionado para que as rotas do React Router funcionem corretamente em producao.

## Seguranca e proximos passos

- No MVP atual, a chave da Gemini ainda esta preparada para uso no cliente. Em producao, mova isso para uma Cloud Function ou backend.
- Restrinja o Firestore Rules para que cada usuario leia e grave apenas os proprios documentos.
- Adicione rate limit para geracao de texto e perguntas para IA.
- Evolua o audio para Gemini TTS e Storage quando quiser salvar narracoes.
- Quebre o bundle com `lazy()` se quiser reduzir o chunk principal.
