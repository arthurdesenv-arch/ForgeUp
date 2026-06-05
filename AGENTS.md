# ForgeUp — Guia para Agentes de IA

## Visão Geral
App mobile de musculação chamado **ForgeUp** (slogan: Forge Your Strength).
Desenvolvido com React Native + Expo, voltado para iniciantes na academia.

## Stack Tecnológica
- Framework: React Native com Expo SDK 54
- Linguagem: JavaScript
- Navegação: React Navigation v6 (native-stack)
- Banco de dados: Firebase Realtime Database
- Autenticação: Firebase Authentication (e-mail/senha)
- Versionamento: Git + GitHub (arthurdesenv-arch/ForgeUp)

## Identidade Visual
- Cor primária: #FF6B00 (laranja)
- Fundo: #0D0D0D (preto)
- Branco: #FFFFFF
- gray100: #1A1A1A
- gray200: #2A2A2A
- gray300: #333333
- gray400: #666666
- gray500: #999999
- Sucesso: #22C55E
- Erro: #EF4444
- Todas as cores ficam centralizadas em src/theme/colors.js

## Estrutura de Pastas
- forgeup/ (raiz do projeto)
- forgeup/App.js → ponto de entrada, apenas importa AppNavigator
- forgeup/.env → chaves do Firebase, NÃO sobe pro GitHub
- forgeup/firebaseConfig.js → configuração do Firebase
- forgeup/src/theme/colors.js → todas as cores do app
- forgeup/src/navigation/AppNavigator.js → registra todas as telas
- forgeup/src/components/ → componentes reutilizáveis (ainda vazio)
- forgeup/src/screens/LoginScreen.js → tela de login
- forgeup/src/screens/onboarding/Step1PersonalData.js → dados pessoais
- forgeup/src/screens/onboarding/Step2Body.js → peso, altura, nível
- forgeup/src/screens/onboarding/Step3Goal.js → objetivo do usuário
- forgeup/src/screens/onboarding/Step4Training.js → divisão de treino + cadastro Firebase

## Regras Importantes
1. Nunca commitar o .env — ele está no .gitignore e contém as chaves do Firebase
2. Sempre usar as cores de src/theme/colors.js — nunca escrever cores direto no StyleSheet
3. Padrão de commits: feat: para funcionalidade, fix: para correção, chore: para configuração
4. Toda nova tela deve ser registrada no AppNavigator.js
5. Sem TypeScript — o projeto usa JavaScript puro
6. Instalar dependências com: npx expo install (não npm install direto)

## Firebase
- Projeto ID: forgeup-fff63
- Autenticação: E-mail/senha ativado
- Banco: Realtime Database (us-central1)
- URL do banco: https://forgeup-fff63-default-rtdb.firebaseio.com

## Estrutura do Banco de Dados
- usuarios/{uid}/nome → string
- usuarios/{uid}/email → string
- usuarios/{uid}/telefone → string
- usuarios/{uid}/nascimento → string DD/MM/AAAA
- usuarios/{uid}/genero → Masculino | Feminino | Outro
- usuarios/{uid}/peso → string (kg)
- usuarios/{uid}/altura → string (cm)
- usuarios/{uid}/nivel → Iniciante | Intermediário | Avançado
- usuarios/{uid}/objetivo → Emagrecer | Ganhar massa | Definição | Condicionamento | Saúde geral
- usuarios/{uid}/diasTreino → número de 2 a 7
- usuarios/{uid}/divisaoTreino → AB | ABC | ABCD | ABCDE | ABCDEF | ABCDEFG
- usuarios/{uid}/criadoEm → ISO string

## O que já está pronto
- Tela de Login (e-mail + senha + botão criar conta)
- Onboarding Passo 1: dados pessoais (nome, email, telefone, nascimento, gênero, senha mín. 6 chars)
- Onboarding Passo 2: corpo (peso, altura, nível de experiência)
- Onboarding Passo 3: objetivo (5 opções com emoji)
- Onboarding Passo 4: divisão de treino (2-7 dias, divisão sugerida automaticamente)
- Cadastro real no Firebase Authentication
- Dados do usuário salvos no Realtime Database
- Navegação entre todas as telas do onboarding
- Sistema de cores centralizado em src/theme/colors.js

## O que falta construir (em ordem de prioridade)
1. Login funcional com Firebase (LoginScreen conectada ao auth)
2. Recuperação de senha por e-mail (código de 6 dígitos)
3. Navegação protegida (usuário logado não volta para o Login)
4. Tela Home (streak de dias, treino do dia, acesso rápido à IA e nutrição)
5. Tela Meu Treino (divisão ABC, exercícios, séries/reps/carga)
6. Tela Busca de Exercícios (filtro por músculo, botão de vídeo)
7. Chat com IA assistente integrado
8. Tela Nutrição (dicas personalizadas por objetivo)
9. Tela Perfil do usuário
10. Tela Recuperação de Senha

## Decisões de Produto
- Senha: mínimo 6 caracteres, sem máximo definido
- Recuperação de senha: código de 6 dígitos enviado por e-mail
- Onboarding é obrigatório — usuário não pode pular nenhum passo
- Dias de treino: recomenda 2 a 5, permite até 7
- Divisão de treino sugerida automaticamente baseada nos dias escolhidos
- Usuário pode ajustar a divisão manualmente depois na tela de treinos
- Modo iniciante ativo por padrão
- Streak de dias consecutivos exibido na Home
- Bottom navigation com 5 abas: Home, Treino, Busca, IA, Nutrição

## Como rodar o projeto
1. cd C:\Users\Tania\Projetos\forgeup
2. npx expo start
3. Escanear QR Code com Expo Go no iPhone (mesma rede Wi-Fi)
4. O arquivo .env precisa estar na raiz com as chaves do Firebase

## Variáveis de Ambiente necessárias no .env
- EXPO_PUBLIC_FIREBASE_API_KEY
- EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
- EXPO_PUBLIC_FIREBASE_PROJECT_ID
- EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
- EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- EXPO_PUBLIC_FIREBASE_APP_ID
- EXPO_PUBLIC_FIREBASE_DATABASE_URL