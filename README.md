# DentiCloud - Sistema SaaS Dental Multi-Tenant

> Sistema de gestión dental multi-tenant con IA, integraciones de calendario, WhatsApp, y características avanzadas para consultorios dentales y DSOs.

## 📋 Documentación del Proyecto

Este repositorio contiene la documentación completa para el desarrollo de DentiCloud, un sistema SaaS multi-tenant para gestión de consultorios dentales.

### Documentos Principales

1. **[INVESTIGACION_SISTEMAS_SAAS_DENTAL.md](./INVESTIGACION_SISTEMAS_SAAS_DENTAL.md)** (121 KB)
   - Análisis exhaustivo de sistemas existentes (Dentrix, Open Dental, Curve Dental, etc.)
   - Características y módulos principales que debe tener el sistema
   - Arquitectura multi-tenant para healthcare
   - Compliance HIPAA y GDPR
   - Integraciones clave (calendarios, WhatsApp, pagos, IA)
   - Stack tecnológico recomendado
   - 80+ referencias y fuentes

2. **[ROADMAP_IMPLEMENTACION.md](./ROADMAP_IMPLEMENTACION.md)** (85 KB)
   - Roadmap detallado por fases (0-4)
   - Sprints detallados con tareas específicas
   - Stack tecnológico completo (Next.js, NestJS, PostgreSQL, AWS)
   - Arquitectura del sistema
   - Plan de deployment y CI/CD
   - Estrategia de testing
   - Go-to-market strategy
   - Presupuesto estimado

## 🎯 Visión del Proyecto

### Objetivo

Crear un sistema SaaS multi-tenant moderno para gestión de consultorios dentales que:

- **Simplifica** la gestión de pacientes, citas, tratamientos y facturación
- **Automatiza** recordatorios, confirmaciones y comunicación con pacientes
- **Integra** calendarios (Google, Outlook, Apple), WhatsApp, y pagos
- **Potencia** con IA para chatbot de atención 24/7 y reserva automática
- **Escala** de consultorios individuales a DSOs multi-ubicación
- **Expande** a otras especialidades médicas en el futuro

### Diferenciadores Clave

| Feature | Descripción |
|---------|-------------|
| 🤖 **AI Chatbot** | Atención 24/7 vía WhatsApp/Web, reserva automática, responde FAQs |
| 📅 **Calendar Sync** | Sincronización bidireccional con Google, Outlook, Apple Calendar |
| 💬 **WhatsApp Integration** | Recordatorios, confirmaciones, y chat bidireccional |
| 🏥 **Consultorios Compartidos** | Múltiples dentistas pueden compartir consultorios |
| 🏢 **Multi-Location** | Para DSOs con múltiples ubicaciones |
| 🔒 **HIPAA Compliant** | Arquitectura y controles para compliance desde día 1 |
| 🎨 **UX Moderno** | Interfaz intuitiva, mobile-first, mejor que competencia legacy |

## 📊 Características Principales

### Core Features (MVP)

- ✅ **Multi-tenancy** con super administrador
- ✅ **Gestión de pacientes** con historia médica/dental completa
- ✅ **Scheduling** con calendar view (día, semana, mes)
- ✅ **Gestión de consultorios** y asignación de dentistas
- ✅ **Treatment planning** básico
- ✅ **Comunicaciones** (email, SMS)
- ✅ **Document management** (consentimientos, imágenes)
- ✅ **Authentication** multi-método (email, Google, Apple, Microsoft)

### Advanced Features (Fases 2-4)

- 📊 **Odontograma digital** interactivo
- 📅 **Google/Outlook/Apple Calendar** sync bidireccional
- 💬 **WhatsApp** integration (Baileys → WhatsApp Business API)
- 🤖 **AI Chatbot** con GPT-4 para atención y booking
- 💳 **Billing & Payments** con Stripe
- 🏥 **Insurance integration** (verificación, claims)
- 📈 **Analytics dashboard** con KPIs financieros y operacionales
- 📦 **Inventory management**
- 🏢 **Multi-location** para DSOs
- 📱 **Mobile apps** (pacientes y providers)
- 🎥 **Telesalud** con video calls

## 🛠️ Stack Tecnológico

### Frontend
```
Framework:      Next.js 14+ (App Router)
Language:       TypeScript 5+
UI:             Tailwind CSS + shadcn/ui
State:          Zustand
Forms:          React Hook Form + Zod
Calendar:       FullCalendar
Charts:         Recharts
HTTP:           TanStack Query
Testing:        Vitest + Playwright
```

### Backend
```
Runtime:        Node.js 20 LTS
Framework:      NestJS 10+
Language:       TypeScript 5+
API:            REST + GraphQL (opcional)
ORM:            Prisma
Auth:           Passport.js + JWT
Queue:          BullMQ (Redis)
Testing:        Jest + Supertest
Docs:           Swagger/OpenAPI
```

### Database & Infrastructure
```
Database:       PostgreSQL 15+ (DB per tenant)
Cache:          Redis 7+
Storage:        AWS S3 + CloudFront
Cloud:          AWS (ECS Fargate → EKS)
Container:      Docker + Kubernetes
IaC:            Terraform
CI/CD:          GitHub Actions
Monitoring:     CloudWatch + Sentry + DataDog
```

### Integraciones
```
Auth:           Google OAuth, Apple Sign In, Microsoft OAuth
Calendars:      Google Calendar, Microsoft Graph, CalDAV
Communication:  Twilio (SMS), SendGrid (Email), WhatsApp Business API
Payments:       Stripe
AI:             OpenAI GPT-4 / Dialogflow CX
```

## 🗓️ Timeline

| Fase | Duración | Descripción | Milestones |
|------|----------|-------------|------------|
| **Fase 0** | 2-4 semanas | Discovery & Planning | Arquitectura, diseños, PRD |
| **Fase 1** | 3-4 meses | MVP | Auth, pacientes, scheduling, communications |
| **Fase 2** | 2-3 meses | Integrations | Odontograma, calendarios, WhatsApp, portal pacientes |
| **Fase 3** | 3-4 meses | Advanced | AI chatbot, billing, payments, analytics, inventory |
| **Fase 4** | 2-3 meses | Scale | Multi-location, mobile apps, telesalud |
| **TOTAL** | **12-14 meses** | De inicio a producto completo | |

## 📈 Business Model

### Pricing

| Tier | Precio | Target | Features |
|------|--------|--------|----------|
| **Starter** | $99/mes | Consultorios pequeños (1 dentista) | Features básicos, 500 pacientes, email support |
| **Professional** | $299/mes ⭐ | Consultorios medianos (2-5 dentistas) | Todas las features, pacientes ilimitados, priority support |
| **Enterprise** | Custom | DSOs, clínicas grandes (5+ dentistas) | Multi-location, white-label, dedicated support, SLA 99.9% |

### Add-ons
- AI Chatbot avanzado: +$50/mes
- Telesalud: +$30/mes por proveedor
- SMS adicionales: $0.01/SMS (después de 1000 incluidos)

### Proyección

| Métrica | 6 Meses | 12 Meses | 24 Meses |
|---------|---------|----------|----------|
| **Clientes** | 75 | 250 | 750 |
| **MRR** | $20k | $70k | $250k |
| **ARR** | $240k | $840k | $3M |

**Break-even estimado:** 12-18 meses con ~185 clientes pagos

## 🏗️ Arquitectura

### Multi-Tenancy Model

**Database-per-Tenant (Hybrid)**

```
Shared Platform DB
├── Super Admin data
├── Tenant metadata
├── System catalogs
└── Cross-tenant audit logs

Tenant 1 DB (Clinic A)
├── Users, Patients, Appointments
├── Treatment plans, Documents
├── Invoices, Payments
└── Analytics data

Tenant 2 DB (Clinic B)
├── [Same schema]

Tenant N DB (Clinic N)
├── [Same schema]
```

**Ventajas:**
- ✅ HIPAA compliance (máximo aislamiento de PHI)
- ✅ Fácil backup/restore por tenant
- ✅ Escalabilidad independiente
- ✅ Customización profunda si se necesita

### High-Level Architecture

```
Users → CDN (CloudFront) → ALB
         ↓                   ↓
    Static Assets      Next.js + NestJS
                            ↓
                    ┌───────┼───────┐
                    ↓       ↓       ↓
                PostgreSQL Redis   S3
                (Multi-DB)        (Files)
                    ↓
                Workers (BullMQ)
                ↓       ↓       ↓
              Email  SMS  WhatsApp
```

## 🔒 Compliance & Security

### HIPAA Compliance

- ✅ **Encryption:** AES-256 at rest, TLS 1.3 in transit
- ✅ **Access Control:** RBAC + MFA
- ✅ **Audit Logs:** Comprehensive logging de todos los accesos a PHI
- ✅ **BAAs:** Con AWS y todos los sub-processors
- ✅ **Data Isolation:** DB separada por tenant
- ✅ **Breach Notification:** Plan documentado (60 días)

### Security Measures

- 🔐 Defense-in-depth architecture
- 🔐 Automated vulnerability scanning (Snyk)
- 🔐 Penetration testing (antes de launch, luego anualmente)
- 🔐 SOC 2 Type II certification (objetivo año 1)
- 🔐 Regular security audits
- 🔐 Incident response plan

## 📱 User Roles

| Role | Descripción | Permisos |
|------|-------------|----------|
| **Super Admin** | Administrador de plataforma | Gestiona todos los tenants, configuración global |
| **Tenant Admin** | Dueño de clínica | Gestiona su clínica, usuarios, configuración |
| **Dentist** | Proveedor | Pacientes, citas, tratamientos, facturación |
| **Hygienist** | Higienista | Citas de limpieza, charting, educación |
| **Front Desk** | Recepcionista | Scheduling, check-in, comunicación |
| **Billing** | Facturación | Invoices, pagos, insurance claims |
| **Patient** | Paciente | Portal: ver citas, documentos, pagar |

## 🚀 Getting Started (Futuro)

_Una vez que el desarrollo comience, aquí irán las instrucciones de instalación._

```bash
# Clone el repositorio
git clone https://github.com/yourorg/denticloud.git

# Setup backend
cd backend
npm install
cp .env.example .env
# Configure database URL, Redis, AWS credentials
npm run db:migrate
npm run db:seed
npm run start:dev

# Setup frontend
cd ../frontend
npm install
cp .env.example .env
# Configure API URL
npm run dev

# Con Docker Compose
docker-compose up
```

## 📚 Módulos del Sistema

### 1. Gestión de Pacientes
- CRUD completo
- Historia médica y dental
- Alergias y medicamentos
- Documentos (consentimientos, imágenes)
- Portal de pacientes

### 2. Scheduling
- Calendar view (día, semana, mes)
- Multi-provider, multi-operatory
- Recurring appointments
- Waitlist management
- Online booking

### 3. Odontograma Digital
- Interactive tooth chart
- Periodontal charting
- Findings tracking
- Before/after comparisons
- Integration con treatment plans

### 4. Treatment Planning
- Multiple plan options
- Procedure library (ADA codes)
- Cost estimation
- Insurance estimation
- Visual presentation
- Approval workflow

### 5. Comunicaciones
- Email (SendGrid)
- SMS (Twilio)
- WhatsApp (Business API)
- Automated reminders
- Confirmations
- Template system

### 6. AI Chatbot
- Natural language understanding
- 24/7 availability
- Appointment booking
- FAQ responses
- Handoff to human
- Multi-channel (WhatsApp, Web)

### 7. Billing & Payments
- Invoicing
- Payment processing (Stripe)
- Insurance verification
- Claims submission
- Payment plans
- A/R management

### 8. Analytics & Reports
- Financial KPIs (revenue, collections, A/R)
- Operational KPIs (appointments, no-shows, new patients)
- Provider performance
- Custom reports
- Export to Excel/PDF

### 9. Inventory
- Stock tracking
- Low stock alerts
- Usage per procedure
- Supplier management
- Expiry tracking

### 10. Multi-Location (DSO)
- Centralized management
- Cross-location scheduling
- Consolidated reporting
- Location-specific settings

## 🎓 Expansión Futura

El sistema está diseñado para escalar más allá de odontología:

- 🏥 **Medicina General**
- 👁️ **Oftalmología**
- 🦴 **Fisioterapia**
- 💆 **Estética**
- 🐕 **Veterinaria**
- 🧘 **Wellness Centers**

La arquitectura modular permite:
- Templates de especialidad
- Charting personalizado por especialidad
- Procedure libraries específicas
- Workflows adaptados

## 🤝 Competencia

### Principales Competidores

| Sistema | Fortaleza | Debilidad | Nuestra Ventaja |
|---------|-----------|-----------|-----------------|
| **Dentrix** | Robusto, maduro | UX anticuada, caro, on-premise | UX moderna, cloud-native, pricing accesible |
| **Open Dental** | Personalizable | Complejidad, curva aprendizaje | Más simple, AI chatbot, WhatsApp |
| **Curve Dental** | Cloud-first | Caro, menos features | Mejor pricing, más integraciones |
| **SimplePractice** | Fácil de usar | Limitado para dental | Especializado dental, odontograma |

## 💡 Propuesta de Valor

### Para Consultorios Pequeños
> "Todo lo que necesitas para gestionar tu consultorio dental en un solo lugar, sin complejidad ni costos excesivos."

- Setup en minutos, no días
- Precio accesible ($99/mes)
- Soporte en español
- Sin contratos largos

### Para Consultorios Medianos
> "Automatiza tu práctica, mejora la experiencia del paciente, y crece tu negocio con inteligencia de datos."

- AI chatbot reduce no-shows
- Recordatorios automáticos
- Portal de pacientes
- Analytics para decisiones

### Para DSOs
> "Gestiona múltiples ubicaciones con visibilidad completa, procesos estandarizados, y data centralizada."

- Vista consolidada
- Reportes cross-location
- Compartición de recursos
- Economías de escala

## 📞 Contacto

**Equipo de Desarrollo:** [Tu contacto aquí]

**Links:**
- 🌐 Website: [https://denticloud.com](https://denticloud.com) (futuro)
- 📧 Email: info@denticloud.com
- 💬 Slack: [Link al workspace]

## 📄 Licencia

[Definir licencia - probablemente Proprietary para SaaS comercial]

---

## 🔄 Próximos Pasos

1. ✅ **Revisar documentación** completa (investigación + roadmap)
2. ⏳ **Aprobar plan** y ajustar según feedback
3. ⏳ **Formar equipo** de desarrollo
4. ⏳ **Iniciar Fase 0** (Discovery & Planning)
   - Customer interviews (10-15 dentistas)
   - Technical spikes (POCs)
   - Diseños UI/UX
   - Setup infrastructure
5. ⏳ **Kick off desarrollo** (Sprint 1 de MVP)

---

**Última actualización:** 30 de Diciembre, 2025

**Estado del proyecto:** 📋 Planning Phase

**Versión de documentación:** 1.0
