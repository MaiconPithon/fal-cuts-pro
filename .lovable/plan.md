

# 🏆 Barbearia do Fal - App de Agendamento

## Visão Geral
Aplicativo web (PWA) instalável no celular para agendamento de horários na Barbearia do Fal, com visual moderno em preto, dourado e branco, estilo masculino/barbearia. O logo da barbearia será usado no app.

---

## 📱 Página Principal (Cliente)

### Hero / Topo
- Logo da Barbearia do Fal em destaque
- Nome "Barbearia do Fal" e info de contato
- Horário: Terça a Sábado, 08:00 às 21:00 (Domingo opcional, controlado pelo barbeiro)
- Botão "Agendar Horário"

### Tabela de Serviços e Preços
- Corte Degradê — R$25,00
- Corte Simples — R$20,00
- Barba — R$10,00
- Bigode + Cavanhaque — R$5,00
- Sobrancelha — R$5,00
- Sobrancelha Feminina — R$10,00
- Pigmentação — R$10,00
- Preços editáveis pelo admin

### Botão Flutuante do WhatsApp
- Sempre visível no canto inferior direito
- Abre conversa no WhatsApp (71 98833-5501)

---

## 📅 Fluxo de Agendamento (Cliente)

1. **Escolher serviço(s)** — selecionar um ou mais serviços da lista
2. **Escolher data** — calendário mostrando apenas dias disponíveis (terça a sábado + domingo quando habilitado)
3. **Escolher horário** — slots de horário disponíveis (horários já agendados ficam bloqueados)
4. **Informar dados** — Nome e telefone do cliente
5. **Escolher forma de pagamento**:
   - **Pix**: exibe QR Code da chave 71 98833-5501 + botão para enviar comprovante via WhatsApp
   - **Cartão de crédito**: pagamento online via Stripe
   - **Dinheiro**: pagar no local
6. **Confirmação** — resumo do agendamento com opção de enviar confirmação via WhatsApp (nome, serviço, data/hora, pagamento)

---

## 💳 Pagamentos

- **Pix**: QR Code gerado com a chave 71 98833-5501 exibido na tela. Botão para enviar comprovante pelo WhatsApp
- **Cartão de crédito**: Integração com Stripe para pagamento online real
- **Dinheiro**: Opção marcada, pagamento presencial

---

## 🔒 Área Administrativa (Barbeiro)

Login com email e senha (autenticação via Supabase).

### Painel do Barbeiro:
- **Agenda do dia**: ver todos os agendamentos com nome, serviço, horário e status de pagamento
- **Gerenciar disponibilidade**: abrir/fechar agenda por dia, habilitar/desabilitar domingo
- **Bloquear horários**: marcar horários como indisponíveis manualmente
- **Editar serviços e preços**: alterar valores dos serviços
- **Relatório de faturamento**: resumo simples de receita por período (diário/semanal/mensal)

---

## 📱 PWA (App Instalável)

- Funciona como aplicativo no celular
- Ícone personalizado com o logo da barbearia
- Instalável via "Adicionar à tela inicial"

---

## 🗄️ Backend (Lovable Cloud / Supabase)

- **Banco de dados** para armazenar: serviços, agendamentos, configurações de horários e disponibilidade
- **Autenticação** para o painel admin
- **Stripe** para pagamentos por cartão de crédito
- **Tabela de roles** para acesso admin seguro

---

## 🎨 Design

- Tema escuro: fundo preto, detalhes em dourado e branco
- Tipografia forte e masculina
- Logo da Barbearia do Fal integrado
- Interface simples, intuitiva e mobile-first

