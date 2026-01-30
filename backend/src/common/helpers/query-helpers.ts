/**
 * Common select patterns for optimized Prisma queries
 * Use these instead of full includes to reduce data transfer and improve performance
 */

// Patient select for lists (minimal data)
export const patientSelectMinimal = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
} as const;

// Patient select with user info
export const patientSelectWithUser = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
    },
  },
} as const;

// Patient full select for detail views
export const patientSelectFull = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  dateOfBirth: true,
  gender: true,
  documentId: true,
  medicalHistory: true,
  allergies: true,
  medications: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  portalEnabled: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      avatarUrl: true,
    },
  },
} as const;

// User select for lists
export const userSelectMinimal = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

// User select with profile
export const userSelectWithProfile = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatarUrl: true,
  specialization: true,
  licenseNumber: true,
} as const;

// Appointment select for lists
export const appointmentSelectList = {
  id: true,
  appointmentDate: true,
  duration: true,
  status: true,
  procedureType: true,
  notes: true,
  reminderSent: true,
  patient: {
    select: patientSelectMinimal,
  },
  operatory: {
    select: {
      id: true,
      name: true,
      clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} as const;

// Appointment select for calendar
export const appointmentSelectCalendar = {
  id: true,
  appointmentDate: true,
  duration: true,
  status: true,
  procedureType: true,
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  operatory: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

// Invoice select for lists
export const invoiceSelectList = {
  id: true,
  invoiceNumber: true,
  issueDate: true,
  dueDate: true,
  status: true,
  total: true,
  amountPaid: true,
  balance: true,
  patient: {
    select: patientSelectMinimal,
  },
} as const;

// Treatment plan select for lists
export const treatmentPlanSelectList = {
  id: true,
  title: true,
  status: true,
  totalCost: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  patient: {
    select: patientSelectMinimal,
  },
  _count: {
    select: {
      items: true,
    },
  },
} as const;

// Clinic select minimal
export const clinicSelectMinimal = {
  id: true,
  name: true,
  phone: true,
  address: true,
} as const;

// Operatory select
export const operatorySelectMinimal = {
  id: true,
  name: true,
  floor: true,
  isActive: true,
} as const;

// Tenant select minimal
export const tenantSelectMinimal = {
  id: true,
  name: true,
  subdomain: true,
} as const;

// Tenant select with subscription info
export const tenantSelectWithSubscription = {
  id: true,
  name: true,
  subdomain: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  maxPatients: true,
  storageGB: true,
  createdAt: true,
} as const;

/**
 * Build pagination params
 */
export function buildPagination(page: number = 1, limit: number = 20) {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(100, Math.max(1, limit));

  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
  };
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(startDate?: Date | string, endDate?: Date | string) {
  const filter: any = {};

  if (startDate) {
    filter.gte = typeof startDate === 'string' ? new Date(startDate) : startDate;
  }

  if (endDate) {
    filter.lte = typeof endDate === 'string' ? new Date(endDate) : endDate;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Build search filter for multiple fields
 */
export function buildSearchFilter(search: string, fields: string[]) {
  if (!search || search.trim().length === 0) {
    return undefined;
  }

  const normalizedSearch = search.trim();

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: normalizedSearch,
        mode: 'insensitive' as const,
      },
    })),
  };
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
  };
}
