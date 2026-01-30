import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublicService {
    constructor(private prisma: PrismaService) { }

    async findAllClinics(query: { city?: string; specialty?: string }) {
        const where: any = {};

        // Note: City is not yet in Tenant schema, ignoring for now
        // if (query.city) { ... }

        return this.prisma.tenant.findMany({
            where,
            select: {
                id: true,
                name: true,
                subdomain: true,
                // address: true, // Not in schema
                // city: true,    // Not in schema
                // phone: true,   // Not in schema
                // logo: true,    // Not in schema
                users: {
                    where: { role: 'DENTIST' },
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                    },
                    take: 3,
                }
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
                // address: true,
                // city: true,
                // phone: true,
                users: {
                    where: { role: 'DENTIST' },
                    select: {
                        id: true,
                        name: true,
                        specialization: true,
                        // bio: true, // Not in schema
                    },
                },
            },
        });
    }

    async findDentists() {
        return this.prisma.user.findMany({
            where: { role: 'DENTIST' },
            select: {
                id: true,
                name: true,
                specialization: true,
                tenantMemberships: {
                    select: {
                        tenant: {
                            select: {
                                name: true,
                                subdomain: true,
                                // city: true,
                            }
                        }
                    }
                }
            },
            take: 20,
        });
    }
}
