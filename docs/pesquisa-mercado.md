# Pesquisa de Mercado — Gerenciador de Cursos e Eventos

**Data:** 01 de agosto de 2026
**Fase:** Fase 1 — Pesquisa de mercado
**Fontes:** Sympla, Eventbrite, Even3

---

## 1. Plataformas Estudadas

### 1.1 Sympla (produtores.sympla.com.br)

Maior plataforma de eventos do Brasil. Foco em produção e venda de ingressos.

**Features identificadas (via schema.org JSON-LD):**

| Feature | Descrição | Relevância para nosso app |
|---------|-----------|---------------------------|
| Antecipação de pagamento | Repasse antecipado antes do evento | 🟡 Pós-MVP (nosso app é local) |
| Formulários personalizados | Coletar dados customizados dos participantes | 🟢 Útil para Fase 4 (inscrições) |
| Credenciamento mobile | Check-in pelo celular | 🔴 Útil mas complexo |
| Lugar marcado | Mapa de assentos selecionáveis | 🔴 Nice-to-have distante |
| Check-in | Controle de entrada no evento | 🟡 Pós-MVP |
| Integrações | Automação via webhooks/API | 🔴 Fora do escopo client-side |
| Marketing integrado | Email, página de venda, automação | 🔴 Fora do escopo |
| Virada de lote automática | Troca de lotes por data/configuração | 🟡 Pós-MVP |
| Certificados digitais | Emissão automática, sem custo | 🟢 Já previsto na skill |
| Opções de pagamento | Pix, boleto, cartão, parcelamento | 🟡 Referência para campo `paymentMethod` |
| Evento Seguro | Seguro opcional para o participante | 🔴 Fora do escopo |

### 1.2 Eventbrite (eventbrite.com/organizer)

Plataforma global. Recém-adquirida pela Bending Spoons, com roadmap ativo.

**Features identificadas (via JSON estruturado na página):**

| Feature | Descrição | Relevância para nosso app |
|---------|-----------|---------------------------|
| Venda de ingressos online | Tipos flexíveis (presencial/online) | 🟢 Base do nosso sistema |
| Reserved seating | Assentos reservados com mapa | 🔴 Nice-to-have distante |
| Timed entry | Ingressos por faixa horária | 🟡 Pós-MVP |
| Eventbrite Ads | Anúncios integrados | 🔴 Fora do escopo |
| Email marketing | Ferramenta integrada | 🔴 Fora do escopo |
| Check-in app | App móvel para check-in | 🟡 Pós-MVP (lista de presença) |
| Tap to pay | Pagamentos sem contato | 🔴 Para apps mobile nativos |
| Analytics e relatórios | Dashboard detalhado | 🟢 Já previsto (Fases 5-6) |
| Event flyer tool | Gerar flyer com QR code | 🟡 Pós-MVP |
| Perfil do organizador | Capa, galeria, estatísticas | 🔴 Para marketplace |
| Ingressos na Wallet | Apple/Google Wallet | 🔴 Para apps nativos |
| Notificações automáticas | Email ao mudar data/local | 🔴 Para SaaS |
| Save before publishing | Salvar rascunho antes de publicar | 🟢 CRÍTICO — adicionar status "rascunho" |
| Check-in window | Janela de tempo para check-in | 🟡 Pós-MVP |
| Multi-slot scanning | Múltiplas sessões simultâneas | 🔴 Complexo |

### 1.3 Even3 (even3.com.br)

Plataforma brasileira voltada para academicos e eventos corporativos.

**Features identificadas (via menu de navegação):**

| Feature | Descrição | Relevância para nosso app |
|---------|-----------|---------------------------|
| Certificados | Emissão de certificados digitais | 🟢 Já previsto na skill |
| Divulgação de eventos | Marketing e descoberta | 🔴 Fora do escopo |
| Venda de ingressos | Ingressos com lotes | 🟢 Base do nosso sistema |
| Gestão de eventos | Organização geral | 🟢 Core do nosso app |
| Soluções pós-evento | Pós-evento: relatórios, certificados | 🟢 Já previsto (Fases 5-7) |
| Pagamento de fornecedores | Gestionar pagamentos a palestrante, buffet | 🟡 Útil! Adicionar como feature |
| Eventos online/presenciais/híbridos | Suporte a formatos | 🟢 Já previsto no campo `type` |

---

## 2. Análise Consolidada

### 2.1 Features Essenciais (validadas pelo mercado)

Todas as três plataformas têm em comum:

1. **CRUD de eventos** ✅ já na skill
2. **Venda de ingressos / inscrições** ✅ já na skill
3. **Lotes de ingressos** — NÃO está na skill, adicionar
4. **Certificados digitais** ✅ já na skill (opcional)
5. **Relatórios e analytics** ✅ já na skill
6. **Controle financeiro** ✅ já na skill
7. **Check-in / lista de presença** — NÃO está na skill, adicionar como pós-MVP
8. **Status de rascunho** ✅ já na skill (campo `status: "rascunho"`)

### 2.2 Features que faltam na skill

Identificadas na pesquisa e que devem ser adicionadas:

#### Lotes de ingressos
- **O que é:** Múltiplos lotes com preço crescente e data de virada automática
- **Como modelar:** Adicionar array `lots` no schema do evento:
  ```json
  {
    "lotName": "Lote 1",
    "price": 50.00,
    "capacity": 30,
    "startDate": "ISO 8601",
    "endDate": "ISO 8601",
    "sold": 0
  }
  ```
- **UX:** Card do evento mostra lote atual ativo. Virada automática ao expirar a data.
- **Referências:** Sympla (Virada de Lote), Even3 (lotes)

#### Check-in / Lista de presença
- **O que é:** Marcar quem compareceu ao evento
- **Como modelar:** Adicionar campo `checkedIn: boolean` e `checkedInAt: ISO 8601 | null` no schema de inscrição
- **UX:** Botão de check-in ao lado de cada participante, filtro "apenas presentes"
- **Referências:** Sympla (Check-in), Eventbrite (Check-in app)

#### Pagamento de fornecedores
- **O que é:** Controlar pagamentos a palestrantes, buffet, etc. além de despesas
- **Como modelar:** A transação financeira já tem `type: "despesa"` — adicionar opcionalmente `payee: string` (quem recebe) e `paidTo: boolean`
- **UX:** Marcar despesas como "pagas" ou "pendentes" no dashboard financeiro
- **Referências:** Even3 (Pagamento de fornecedores)

#### Formulário customizado na inscrição
- **O que é:** Campos adicionais opcionais no formulário de inscrição
- **Como modelar:** Adicionar `customFields: { key: value }` no schema de inscrição
- **UX:** Configuração por evento de quais campos extras coletar
- **Referências:** Sympla (Formulários personalizados)

### 2.3 Insights de UX

#### Navegação
- **Sympla:** Dashboard → lista de eventos → detalhes com abas
- **Eventbrite:** "Create event" como CTA principal, dashboard com métricas em destaque
- **Even3:** Menu lateral com categorias (Gestão, Divulgação, Pós-evento)
- **Nosso app:** Seguir o padrão da skill — tabs na parte superior (Eventos | Inscrições | Financeiro | Relatórios)

#### Cards de evento
- Todas as plataformas mostram: nome, data, local, vagas, status
- **Sympla adiciona:** Preço do lote atual, % de vagas preenchidas
- **Eventbrite adiciona:** Total arrecadado, status publicado/rascunho
- **Ação:** Nosso card deve mostrar nome, data, vagas preenchidas/total, preço, status badge

#### Fluxo de inscrição/inserção
- Sympla e Eventbrite têm formulários multi-etapa (dados → pagamento → confirmação)
- Even3 tem formulário mais simples
- **Para nosso app (offline/gerenciador):** Formulário único é suficiente — o organizador está cadastrando, não o participante comprando

#### Status de eventos
- **Sympla:** Rascunho → Publicado → Encerrado → Concluído
- **Eventbrite:** Draft → Live → Ended → Completed
- **Even3:** Em preparação → Aberto para inscrições → Encerrado → Realizado
- **Nossa skill já tem:** rascunho → aberto → fechado → concluido → cancelado ✅

### 2.4 Modelos de Pricing/Custo que valem para o app

| Categoria de Receita | Categoria de Despesa |
|----------------------|----------------------|
| Venda de ingressos | Aluguel do local |
| Patrocínio | Material/promocional |
| Venda de produtos/extras | Palestrante/Honorários |
| Doações | Buffet/catering |
| | Equipamentos |
| | Marketing/publicidade |
| | Seguro |
| | Outros |

Todas essas categorias já estão no schema da skill (`category: "inscricao|patrocinio|venda|local|material|palestrante|buffet|outros"`), mas faltam **equipamentos**, **marketing/publicidade** e **doações**.

---

## 3. Atualizações Recomendadas na Skill

### 3.1 Schema de dados

#### Adicionar ao Schema: Evento
```json
{
  "lots": [
    {
      "id": "string",
      "lotName": "string",
      "price": "number",
      "capacity": "number",
      "startDate": "ISO 8601",
      "endDate": "ISO 8601 | null",
      "sold": "number"
    }
  ]
}
```

#### Adicionar ao Schema: Inscrição
```json
{
  "checkedIn": "boolean",
  "checkedInAt": "ISO 8601 | null",
  "customFields": "object | null"
}
```

#### Adicionar ao Schema: Transação Financeira
```json
{
  "payee": "string | null",
  "paidTo": "boolean | null"
}
```

#### Expandir categorias de transação
- Receita: inscricao, patrocinio, venda, doacao, outros
- Despesa: local, material, palestrante, buffet, equipamentos, marketing, seguro, outros

### 3.2 Features pós-MVP a adicionar à skill

1. **Lotes de ingressos** — múltiplos lotes com virada automática
2. **Check-in / lista de presença** — marcar comparecimento
3. **Pagamento de fornecedores** — marcar despesas como pagas/pendentes, registrar destinatário
4. **Formulário customizado** — campos extras por evento
5. **Flyer/folder do evento** — gerar página imprimível com QR code (Eventbrite inspirou)

### 3.3 Boas práticas adicionais
- **Status "rascunho" sempre:** Salvar automaticamente como rascunho antes de publicar (Eventbrite validou isso)
- **Empty states amigáveis:** Todas as plataformas usam illustrations + CTA nos estados vazios
- **Badges coloridos:** Status visual imediato (verde=ativo, amarelo=pendente, vermelho=cancelado, cinza=rascunho)
- **Persistência frequente:** Salvar no localStorage a cada alteração de formulário (autosave)

---

## 4. Referências das Plataformas Estudadas

| Plataforma | URL | Tipo | Destaque |
|------------|-----|------|----------|
| Sympla | produtores.sympla.com.br | Brasileira, full-featured | Credenciamento mobile, certificados grátis, virada de lote |
| Eventbrite | eventbrite.com/organizer | Global, marketplace | Ads, email marketing, analytics, reserved seating, tap-to-pay |
| Even3 | even3.com.br | Brasileira, acadêmico | Pagamento de fornecedores, foco em formação acadêmica |

---

## 5. Conclusão

A skill `event-course-manager-builder` já cobre a grande maioria das features essenciais (CRUD eventos, inscrições, financeiro, relatórios, dashboard, persistência). As principais adições necessárias são:

1. **Lotes de ingressos** — recurso básico que todas as 3 plataformas têm
2. **Check-in** — fundamental para eventos presenciais
3. **Categorias financeiras expandidas** — adicionar doação, equipamentos, marketing, seguro
4. **Autosave/rascunho** — UX validada pelo mercado

As features de marketplace (venda online, marketing, patrocínio via API) estão fora do escopo do nosso app 100% client-side e não devem ser priorizadas.
