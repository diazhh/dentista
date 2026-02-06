import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Patient, DataAccessLevel } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { TransferPatientDto } from './dto/transfer-patient.dto';
import { ConsentsService } from '../consents/consents.service';
import { Parser } from 'json2csv';
import { Readable } from 'stream';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private consentsService: ConsentsService,
  ) {}

  async create(providerId: string, tenantId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
    const { userId, email, emergencyContactName, emergencyContactPhone, ...patientData } = createPatientDto;

    let finalUserId = userId;

    if (!finalUserId) {
      if (!email) {
        throw new BadRequestException('Either userId or email must be provided');
      }

      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        const bcrypt = require('bcrypt');
        const defaultPassword = await bcrypt.hash(createPatientDto.documentId, 10);

        user = await this.prisma.user.create({
          data: {
            email,
            name: `${createPatientDto.firstName} ${createPatientDto.lastName}`,
            passwordHash: defaultPassword,
            role: 'PATIENT',
          },
        });
      }

      finalUserId = user.id;
    }

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        emergencyContactName,
        emergencyContactPhone,
        user: {
          connect: { id: finalUserId },
        },
      },
    });

    await this.prisma.providerPatientRelation.create({
      data: {
        patientId: patient.id,
        providerId: providerId,
        tenantId: tenantId,
        isActive: true,
      },
    });

    return patient;
  }

  async findAllForProvider(providerId: string, tenantId: string): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      where: {
        providerPatientRelations: {
          some: {
            providerId: providerId,
            tenantId: tenantId,
            isActive: true,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findOne(id: string, providerId: string, tenantId: string): Promise<any> {
    // Fetch the full patient with all relations
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        providerPatientRelations: {
          some: {
            providerId: providerId,
            tenantId: tenantId,
            isActive: true,
          },
        },
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        providerPatientRelations: {
          where: { isActive: true },
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
          },
        },
        documents: true,
        medicalExams: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Check consent access level for this provider
    const access = await this.consentsService.checkProviderAccess(providerId, id);

    // Get the provider's own local data from the relation
    const providerRelation = patient.providerPatientRelations.find(
      (r) => r.providerId === providerId,
    );

    // Filter patient data based on access level
    return this.filterPatientByAccess(patient, access.dataAccessLevel, providerRelation);
  }

  /**
   * Filters patient data based on the consent data access level.
   * Provider always sees their own local notes/allergies/medications from the relation.
   */
  private filterPatientByAccess(
    patient: any,
    accessLevel: DataAccessLevel,
    providerRelation: any,
  ): any {
    // Base data that all access levels can see
    const base: any = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      // Provider always sees their own local data from the relation
      providerLocalData: providerRelation
        ? {
            providerNotes: providerRelation.providerNotes,
            localMedicalHistory: providerRelation.localMedicalHistory,
            localAllergies: providerRelation.localAllergies,
            localMedications: providerRelation.localMedications,
          }
        : null,
      providerPatientRelations: patient.providerPatientRelations,
      user: patient.user,
      accessLevel,
    };

    if (accessLevel === DataAccessLevel.MINIMAL) {
      // MINIMAL: only basic identification + provider's own local data
      return base;
    }

    if (accessLevel === DataAccessLevel.SCHEDULING_ONLY) {
      // SCHEDULING_ONLY: basic info for scheduling purposes
      return {
        ...base,
        email: patient.email,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
      };
    }

    if (accessLevel === DataAccessLevel.CLINICAL_ONLY) {
      // CLINICAL_ONLY: add medical history, allergies, medications (no documents/exams)
      return {
        ...base,
        email: patient.email,
        documentType: patient.documentType,
        documentId: patient.documentId,
        address: patient.address,
        bloodType: patient.bloodType,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        medications: patient.medications,
        chronicConditions: patient.chronicConditions,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        emergencyContactRelation: patient.emergencyContactRelation,
      };
    }

    if (accessLevel === DataAccessLevel.DOCUMENTS_SHARED) {
      // DOCUMENTS_SHARED: basic info + documents only
      return {
        ...base,
        email: patient.email,
        documentType: patient.documentType,
        documentId: patient.documentId,
        documents: patient.documents,
        medicalExams: patient.medicalExams,
      };
    }

    // FULL: return everything
    return {
      ...base,
      email: patient.email,
      documentType: patient.documentType,
      documentId: patient.documentId,
      address: patient.address,
      bloodType: patient.bloodType,
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      medications: patient.medications,
      chronicConditions: patient.chronicConditions,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone,
      emergencyContactRelation: patient.emergencyContactRelation,
      defaultDataAccess: patient.defaultDataAccess,
      portalEnabled: patient.portalEnabled,
      documents: patient.documents,
      medicalExams: patient.medicalExams,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  async update(id: string, providerId: string, tenantId: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    await this.findOne(id, providerId, tenantId);

    return this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
    });
  }

  async remove(id: string, providerId: string, tenantId: string): Promise<void> {
    await this.findOne(id, providerId, tenantId);

    await this.prisma.providerPatientRelation.updateMany({
      where: {
        patientId: id,
        providerId: providerId,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }

  async search(providerId: string, tenantId: string, searchDto: SearchPatientDto): Promise<Patient[]> {
    const whereConditions: any = {
      providerPatientRelations: {
        some: {
          providerId: providerId,
          tenantId: tenantId,
          isActive: true,
        },
      },
    };

    if (searchDto.documentId) {
      whereConditions.documentId = {
        contains: searchDto.documentId,
        mode: 'insensitive',
      };
    }

    if (searchDto.firstName) {
      whereConditions.firstName = {
        contains: searchDto.firstName,
        mode: 'insensitive',
      };
    }

    if (searchDto.lastName) {
      whereConditions.lastName = {
        contains: searchDto.lastName,
        mode: 'insensitive',
      };
    }

    if (searchDto.phone) {
      whereConditions.phone = {
        contains: searchDto.phone,
        mode: 'insensitive',
      };
    }

    return this.prisma.patient.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async transfer(patientId: string, currentProviderId: string, tenantId: string, transferDto: TransferPatientDto): Promise<void> {
    const patient = await this.findOne(patientId, currentProviderId, tenantId);

    const newProvider = await this.prisma.user.findUnique({
      where: { id: transferDto.newProviderId },
    });

    if (!newProvider) {
      throw new NotFoundException('New provider not found');
    }

    const existingRelation = await this.prisma.providerPatientRelation.findFirst({
      where: {
        patientId: patientId,
        providerId: transferDto.newProviderId,
        isActive: true,
      },
    });

    if (existingRelation) {
      throw new BadRequestException('Patient already assigned to this provider');
    }

    await this.prisma.providerPatientRelation.updateMany({
      where: {
        patientId: patientId,
        providerId: currentProviderId,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    await this.prisma.providerPatientRelation.create({
      data: {
        patientId: patientId,
        providerId: transferDto.newProviderId,
        tenantId: tenantId,
        isActive: true,
      },
    });
  }

  async exportToCSV(providerId: string, tenantId: string): Promise<string> {
    const patients = await this.findAllForProvider(providerId, tenantId);

    const data = patients.map(patient => ({
      documentId: patient.documentId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: (patient as any).user?.email || '',
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join('; ') : '',
      medications: Array.isArray(patient.medications) ? patient.medications.join('; ') : '',
    }));

    const parser = new Parser({
      fields: ['documentId', 'firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'gender', 'allergies', 'medications'],
    });

    return parser.parse(data);
  }

  async importFromCSV(providerId: string, tenantId: string, csvData: any[]): Promise<{ success: number; errors: string[] }> {
    let success = 0;
    const errors: string[] = [];

    for (const row of csvData) {
      try {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: row.email },
        });

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
        } else {
          const newUser = await this.prisma.user.create({
            data: {
              email: row.email,
              name: `${row.firstName} ${row.lastName}`,
              phone: row.phone,
              role: 'PATIENT',
            },
          });
          userId = newUser.id;
        }

        const existingPatient = await this.prisma.patient.findFirst({
          where: {
            documentId: row.documentId,
          },
        });

        if (existingPatient) {
          const hasRelation = await this.prisma.providerPatientRelation.findFirst({
            where: {
              patientId: existingPatient.id,
              providerId: providerId,
              isActive: true,
            },
          });

          if (!hasRelation) {
            await this.prisma.providerPatientRelation.create({
              data: {
                patientId: existingPatient.id,
                providerId: providerId,
                tenantId: tenantId,
                isActive: true,
              },
            });
          }
          success++;
          continue;
        }

        const patient = await this.prisma.patient.create({
          data: {
            userId: userId,
            documentId: row.documentId,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            dateOfBirth: new Date(row.dateOfBirth),
            gender: row.gender || 'OTHER',
            allergies: row.allergies ? row.allergies.split(';').map((a: string) => a.trim()) : [],
            medications: row.medications ? row.medications.split(';').map((m: string) => m.trim()) : [],
          },
        });

        await this.prisma.providerPatientRelation.create({
          data: {
            patientId: patient.id,
            providerId: providerId,
            tenantId: tenantId,
            isActive: true,
          },
        });

        success++;
      } catch (error) {
        errors.push(`Error importing patient ${row.documentId}: ${error.message}`);
      }
    }

    return { success, errors };
  }
}
