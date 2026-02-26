/**
 * Mock PrismaService for unit tests.
 * Provides a deeply-mocked PrismaService so that every model
 * method (findUnique, create, update, findMany, etc.) is a jest.fn().
 */

const modelMethods = [
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
  'count',
  'aggregate',
];

function createModelMock() {
  const mock: Record<string, jest.Mock> = {};
  for (const method of modelMethods) {
    mock[method] = jest.fn();
  }
  return mock;
}

export function createMockPrismaService() {
  return {
    user: createModelMock(),
    tenant: createModelMock(),
    tenantMembership: createModelMock(),
    patient: createModelMock(),
    appointment: createModelMock(),
    session: createModelMock(),
    providerPatientRelation: createModelMock(),
    patientConsent: createModelMock(),
    passwordResetToken: createModelMock(),
    consultationRoom: createModelMock(),
    roomAssignment: createModelMock(),
    medicalService: createModelMock(),
    auditLog: createModelMock(),
    clinic: createModelMock(),
    $transaction: jest.fn((args) => Promise.resolve(args)),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

export type MockPrismaService = ReturnType<typeof createMockPrismaService>;
