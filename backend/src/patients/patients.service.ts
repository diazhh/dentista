import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Patient } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientDto } from './dto/search-patient.dto';
import { TransferPatientDto } from './dto/transfer-patient.dto';
import { Parser } from 'json2csv';
import { Readable } from 'stream';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(dentistId: string, tenantId: string, createPatientDto: CreatePatientDto): Promise<Patient> {
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

    await this.prisma.patientDentistRelation.create({
      data: {
        patientId: patient.id,
        dentistId: dentistId,
        tenantId: tenantId,
        isActive: true,
      },
    });

    return patient;
  }

  async findAllForDentist(dentistId: string, tenantId: string): Promise<Patient[]> {
    return this.prisma.patient.findMany({
      where: {
        patientDentistRelations: {
          some: {
            dentistId: dentistId,
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

  async findOne(id: string, dentistId: string, tenantId: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        patientDentistRelations: {
          some: {
            dentistId: dentistId,
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
        patientDentistRelations: {
          where: { isActive: true },
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, dentistId: string, tenantId: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    await this.findOne(id, dentistId, tenantId);

    return this.prisma.patient.update({
      where: { id },
      data: updatePatientDto,
    });
  }

  async remove(id: string, dentistId: string, tenantId: string): Promise<void> {
    await this.findOne(id, dentistId, tenantId);

    await this.prisma.patientDentistRelation.updateMany({
      where: {
        patientId: id,
        dentistId: dentistId,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }

  async search(dentistId: string, tenantId: string, searchDto: SearchPatientDto): Promise<Patient[]> {
    const whereConditions: any = {
      patientDentistRelations: {
        some: {
          dentistId: dentistId,
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

  async transfer(patientId: string, currentDentistId: string, tenantId: string, transferDto: TransferPatientDto): Promise<void> {
    const patient = await this.findOne(patientId, currentDentistId, tenantId);

    const newDentist = await this.prisma.user.findUnique({
      where: { id: transferDto.newDentistId },
    });

    if (!newDentist) {
      throw new NotFoundException('New dentist not found');
    }

    const existingRelation = await this.prisma.patientDentistRelation.findFirst({
      where: {
        patientId: patientId,
        dentistId: transferDto.newDentistId,
        isActive: true,
      },
    });

    if (existingRelation) {
      throw new BadRequestException('Patient already assigned to this dentist');
    }

    await this.prisma.patientDentistRelation.updateMany({
      where: {
        patientId: patientId,
        dentistId: currentDentistId,
      },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    await this.prisma.patientDentistRelation.create({
      data: {
        patientId: patientId,
        dentistId: transferDto.newDentistId,
        tenantId: tenantId,
        isActive: true,
      },
    });
  }

  async exportToCSV(dentistId: string, tenantId: string): Promise<string> {
    const patients = await this.findAllForDentist(dentistId, tenantId);

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

  async importFromCSV(dentistId: string, tenantId: string, csvData: any[]): Promise<{ success: number; errors: string[] }> {
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
          const hasRelation = await this.prisma.patientDentistRelation.findFirst({
            where: {
              patientId: existingPatient.id,
              dentistId: dentistId,
              isActive: true,
            },
          });

          if (!hasRelation) {
            await this.prisma.patientDentistRelation.create({
              data: {
                patientId: existingPatient.id,
                dentistId: dentistId,
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

        await this.prisma.patientDentistRelation.create({
          data: {
            patientId: patient.id,
            dentistId: dentistId,
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
