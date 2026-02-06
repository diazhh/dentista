import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MedicalSpecialty, UserRole } from '@prisma/client';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    /**
     * Returns the list of all available MedicalSpecialty enum values
     * with human-readable labels.
     */
    getAvailableSpecialties(): { value: string; label: string }[] {
        return Object.values(MedicalSpecialty).map((value) => ({
            value,
            label: value
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase()),
        }));
    }

    async findAllClinics(query: { city?: string; specialty?: string }) {
        // Build membership filter for specialty
        const membershipWhere: any = {
            role: 'PROVIDER',
            isActive: true,
        };

        if (query.specialty) {
            membershipWhere.user = {
                specialties: {
                    has: query.specialty as MedicalSpecialty,
                },
            };
        }

        return this.prisma.tenant.findMany({
            where: {
                // Only return clinics that have matching providers when filtering
                ...(query.specialty && {
                    memberships: {
                        some: membershipWhere,
                    },
                }),
            },
            select: {
                id: true,
                name: true,
                subdomain: true,
                memberships: {
                    where: membershipWhere,
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                specialties: true,
                                bio: true,
                            },
                        },
                    },
                    take: 5,
                },
            },
            take: 20,
        });
    }

    async findClinicBySlug(slug: string) {
        return this.prisma.tenant.findUnique({
            where: { subdomain: slug },
            select: {
                id: true,
                name: true,
                subdomain: true,
                memberships: {
                    where: {
                        role: 'PROVIDER',
                        isActive: true,
                    },
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                specialties: true,
                                bio: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findProviders(query?: { specialty?: string }) {
        const where: any = { role: 'PROVIDER' };

        if (query?.specialty) {
            where.specialties = {
                has: query.specialty as MedicalSpecialty,
            };
        }

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                specialties: true,
                bio: true,
                tenantMemberships: {
                    where: { isActive: true },
                    select: {
                        tenant: {
                            select: {
                                name: true,
                                subdomain: true,
                            },
                        },
                    },
                },
            },
            take: 20,
        });
    }

    /**
     * Allows a CLINIC_ADMIN user to claim an unclaimed clinic
     * by setting themselves as the adminUserId.
     */
    async claimClinic(clinicId: string, userId: string) {
        // Verify the user exists and has the CLINIC_ADMIN role
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== UserRole.CLINIC_ADMIN) {
            throw new ForbiddenException(
                'Only users with the CLINIC_ADMIN role can claim a clinic',
            );
        }

        // Verify the clinic exists
        const clinic = await this.prisma.clinic.findUnique({
            where: { id: clinicId },
            select: { id: true, adminUserId: true, name: true, isActive: true },
        });

        if (!clinic) {
            throw new NotFoundException('Clinic not found');
        }

        if (!clinic.isActive) {
            throw new BadRequestException('This clinic is not active');
        }

        // Check if the clinic already has an admin
        if (clinic.adminUserId) {
            throw new BadRequestException(
                'This clinic has already been claimed by another administrator',
            );
        }

        // Check if this user already administers another clinic
        const existingClaim = await this.prisma.clinic.findFirst({
            where: { adminUserId: userId },
            select: { id: true, name: true },
        });

        if (existingClaim) {
            throw new BadRequestException(
                `You already administer the clinic "${existingClaim.name}". A user can only administer one clinic.`,
            );
        }

        // Claim the clinic
        const updatedClinic = await this.prisma.clinic.update({
            where: { id: clinicId },
            data: { adminUserId: userId },
            select: {
                id: true,
                name: true,
                adminUserId: true,
                email: true,
                phone: true,
            },
        });

        return {
            message: `Clinic "${updatedClinic.name}" has been successfully claimed`,
            clinic: updatedClinic,
        };
    }
}
