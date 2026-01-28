# DentiCloud - Documentación del Sistema

**Sistema SaaS para Gestión Dental Multi-Tenant**

---

## Modelo de Negocio CORRECTO ✅

### Principios Fundamentales

1. **TODOS los dentistas son clientes y pagan suscripción**
   - Cada dentista tiene su propia cuenta (tenant)
   - Cada dentista selecciona un plan (Starter, Professional, etc.)
   - NO existe "dentista invitado gratis"

2. **Pacientes tienen relación N:M con dentistas**
   - Un paciente puede tener múltiples dentistas a lo largo del tiempo
   - El paciente puede ver su historial con CADA dentista
   - Ejemplo: Paciente Juan vio al Dr. A (2023-2024) y ahora ve al Dr. B (2024-2025)

3. **Staff trabaja para múltiples dentistas**
   - Staff tiene UNA cuenta en la plataforma
   - Recibe invitaciones de múltiples dentistas
   - Puede gestionar consultorios de varios dentistas
   - Pago del staff es EXTERNO (fuera de la plataforma)

4. **Clínicas y Consultorios**
   - **Clínicas** son creadas por Super Admin
   - **Consultorios** pertenecen a clínicas
   - Varios dentistas pueden compartir UN consultorio
   - Los consultorios se asignan a dentistas según horarios

5. **WhatsApp Chatbot - Feature Crítico** ⭐
   - Cada dentista tiene su propio número de WhatsApp
   - Escanean QR (Baileys) en configuración
   - Bot puede agendar citas, enviar facturas, recetas, recordatorios
   - Funciona para pacientes y no-pacientes

6. **Arquitectura - Single Database**
   - UNA sola base de datos para todos los tenants
   - Row-level security con `tenant_id`
   - Más simple y escalable que multi-DB

---

## Entidades Principales

```
┌─────────────────────────────────────────────┐
│              SUPER ADMIN                     │
│  - Gestiona plataforma                       │
│  - Crea clínicas y consultorios             │
│  - Gestiona planes de suscripción           │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│              CLÍNICAS                        │
│  - Creadas por Super Admin                  │
│  - Tienen múltiples consultorios            │
│  - Ejemplo: "Clínica Dental ABC"           │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│            CONSULTORIOS                      │
│  - Pertenecen a clínicas                    │
│  - Compartidos por múltiples dentistas      │
│  - Tienen horarios y disponibilidad         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│             DENTISTAS                        │
│  - TODOS pagan suscripción                  │
│  - Cada uno es un tenant                    │
│  - Trabajan en uno o más consultorios       │
│  - Tienen su propio WhatsApp bot            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│              PACIENTES                       │
│  - Relación N:M con dentistas               │
│  - Pueden ver historial con cada dentista   │
│  - Acceso via portal de pacientes           │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│               STAFF                          │
│  - Trabajan para múltiples dentistas        │
│  - Reciben invitaciones                     │
│  - Gestionan consultorios                   │
│  - Pago externo                             │
└─────────────────────────────────────────────┘
```

---

## Escenarios de Uso

### Escenario 1: Dentista Individual

```
Dr. Juan Pérez:
├─ Paga: Plan Professional ($299/mes)
├─ Trabaja en: Consultorio 1 de Clínica ABC
├─ Horario: Lun-Vie 9am-5pm
├─ Tiene: 150 pacientes
├─ Staff: Secretaria Ana (comparte con Dr. López)
└─ WhatsApp: +52-xxx-xxx-xxxx (con bot)
```

### Escenario 2: Dentista Multi-Ubicación

```
Dra. María García:
├─ Paga: Plan Professional ($299/mes)
├─ Trabaja en:
│   ├─ Consultorio 2 de Clínica ABC (Lun-Mie)
│   └─ Consultorio 1 de Clínica XYZ (Jue-Vie)
├─ Tiene: 200 pacientes (atendidos en ambas clínicas)
├─ Staff: Asistente Carlos (solo en Clínica ABC)
└─ WhatsApp: +52-yyy-yyy-yyyy (con bot)
```

### Escenario 3: Staff Multi-Dentista

```
Secretaria Ana:
├─ NO paga (cuenta gratuita de staff)
├─ Trabaja para:
│   ├─ Dr. Juan Pérez (Clínica ABC)
│   ├─ Dr. López (Clínica ABC)
│   └─ Dra. Gómez (Clínica XYZ)
├─ Acceso a:
│   ├─ Agendar citas para los 3 dentistas
│   ├─ Ver pacientes de los 3
│   └─ Gestionar documentos
└─ Pago: Recibe de cada dentista externamente
```

### Escenario 4: Paciente Multi-Dentista

```
Paciente: Luis Rodríguez
├─ Historial con Dr. Pérez (2022-2023)
│   ├─ 5 citas
│   ├─ 2 limpiezas
│   └─ 1 filling
├─ Historial con Dra. García (2024-2025)
│   ├─ 3 citas
│   ├─ 1 limpieza
│   └─ 1 crown
└─ Portal: Puede ver ambos historiales
```

---

## Diferencias vs. Modelo Anterior (INCORRECTO)

| Aspecto | ❌ Modelo Anterior | ✅ Modelo CORRECTO |
|---------|-------------------|-------------------|
| **Clientes que pagan** | Clínicas y algunos dentistas | TODOS los dentistas |
| **Dentistas invitados** | No pagan | No existe este concepto |
| **Pacientes** | Pertenecen a UN dentista | Relación N:M con dentistas |
| **Staff** | Pertenece a un tenant | Trabaja para múltiples dentistas |
| **Clínicas** | Son tenants que pagan | Creadas por super admin, no pagan |
| **Consultorios** | Pertenecen a dentistas | Pertenecen a clínicas |
| **Base de datos** | Multi-DB (DB por tenant) | Single DB con tenant_id |
| **WhatsApp** | Fase 3 (tarde) | MVP o Fase 2 (temprano) |

---

## Documentos en esta Carpeta

1. **[01-ARQUITECTURA-SISTEMA.md](./01-ARQUITECTURA-SISTEMA.md)** - Arquitectura completa del sistema
2. **[02-MODELO-DATOS.md](./02-MODELO-DATOS.md)** - Modelo de base de datos detallado
3. **[03-ROLES-PERMISOS.md](./03-ROLES-PERMISOS.md)** - Roles y permisos por tipo de usuario
4. **[04-WHATSAPP-CHATBOT.md](./04-WHATSAPP-CHATBOT.md)** - Integración WhatsApp/Baileys
5. **[05-FLUJOS-PRINCIPALES.md](./05-FLUJOS-PRINCIPALES.md)** - Flujos de usuario principales

---

## Próximos Pasos

1. Revisar toda la documentación
2. Validar modelo con dentistas reales
3. Iniciar implementación según roadmap
4. Priorizar WhatsApp chatbot (diferenciador clave)

---

**Versión:** 3.0 - Modelo Correcto Final
**Última actualización:** 30 de Diciembre, 2025
