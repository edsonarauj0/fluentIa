Você é um desenvolvedor full stack sênior e arquiteto de software.

Quero criar uma aplicação web para me ajudar a estudar inglês diariamente, parecida com o Duolingo, com desafios diários de leitura, escuta e interação com IA.

## Objetivo da aplicação

A aplicação deve gerar um desafio diário para o usuário praticar inglês. O desafio consiste em ler um texto em inglês gerado por IA, ouvir o áudio do texto com pronúncia clara e pausada, selecionar palavras ou frases e perguntar à IA sobre tradução, significado, exemplos de uso, sinônimos, pronúncia e contexto.

## Funcionalidades principais

- Login
- Registro de usuário
- Perfil do usuário
- Seleção de categorias de texto:
  - Notícias
  - Crônicas
  - Poemas
  - Histórias
  - Contos
  - Outros temas personalizados
- Definição da quantidade máxima de caracteres do texto
- Geração diária de texto com IA
- Leitura do texto na tela
- Áudio do texto com fala lenta e clara
- Seleção de palavra ou trecho do texto
- Perguntas para IA sobre a palavra selecionada
- Histórico de desafios concluídos
- Sequência diária/streak
- Temas de cores variados na aplicação
- Níveis de dificuldade:
  - Iniciante
  - Intermediário
  - Avançado

## Tecnologias obrigatórias
Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- React Router
- React Hook Form
- Zod
- Jest
- Testing Library

Backend/Banco:
- Supabase Auth
- Supabase Database
- Supabase Storage, se precisar salvar áudio no futuro

IA:
- Gemini API para gerar textos e responder dúvidas

Áudio:
- Web Speech API no MVP
- Gemini TTS em uma versão futura

## O que eu quero receber

Quero um passo a passo completo para desenvolver essa aplicação do zero, explicando:

1. Como planejar o projeto
2. Como definir as telas
3. Como criar a arquitetura
4. Como configurar o React com TypeScript
5. Como configurar Tailwind e Shadcn UI
6. Como criar autenticação
7. Como modelar o banco de dados
8. Como gerar textos com IA
9. Como gerar ou reproduzir áudio
10. Como permitir seleção de palavras no texto
11. Como salvar progresso do usuário
12. Como criar testes com Jest
13. Como organizar pastas e componentes
14. Como publicar a aplicação
15. Quais cuidados de segurança devo ter

Explique de forma didática, como se eu estivesse aprendendo durante o desenvolvimento.

## MPV:
1. Login
2. Cadastro
3. Escolher categoria
4. Escolher tamanho do texto
5. Gerar texto com IA
6. Ler texto na tela
7. Ouvir texto com Web Speech API
8. Selecionar palavra
9. Perguntar significado para IA
10. Marcar desafio como concluído