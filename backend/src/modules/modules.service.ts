import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MedicalSpecialty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MODULE_DEFINITIONS, ModuleDefinition } from './module-definitions';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  getAvailableModules(specialties: MedicalSpecialty[]): ModuleDefinition[] {
    return Object.values(MODULE_DEFINITIONS).filter((mod) =>
      mod.compatibleSpecialties.some((s) => specialties.includes(s)),
    );
  }

  async getActiveModules(providerId: string) {
    const providerModules = await this.prisma.providerModule.findMany({
      where: { providerId, isActive: true },
    });

    return providerModules.map((pm) => {
      const definition = MODULE_DEFINITIONS[pm.moduleKey];
      return {
        ...pm,
        definition: definition || null,
      };
    });
  }

  async activateModule(providerId: string, moduleKey: string, config?: Record<string, any>) {
    const definition = MODULE_DEFINITIONS[moduleKey];
    if (!definition) {
      throw new BadRequestException(`Module "${moduleKey}" does not exist`);
    }

    const mergedConfig = { ...definition.defaultConfig, ...(config || {}) };

    return this.prisma.providerModule.upsert({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
      create: {
        providerId,
        moduleKey,
        isActive: true,
        config: mergedConfig,
        activatedAt: new Date(),
      },
      update: {
        isActive: true,
        config: mergedConfig,
        activatedAt: new Date(),
      },
    });
  }

  async deactivateModule(providerId: string, moduleKey: string) {
    const existing = await this.prisma.providerModule.findUnique({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Module "${moduleKey}" is not activated`);
    }

    return this.prisma.providerModule.update({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
      data: { isActive: false },
    });
  }

  async getModuleConfig(providerId: string, moduleKey: string) {
    const providerModule = await this.prisma.providerModule.findUnique({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
    });

    if (!providerModule) {
      throw new NotFoundException(`Module "${moduleKey}" is not activated`);
    }

    return {
      moduleKey: providerModule.moduleKey,
      config: providerModule.config,
      isActive: providerModule.isActive,
    };
  }

  async updateModuleConfig(providerId: string, moduleKey: string, config: Record<string, any>) {
    const existing = await this.prisma.providerModule.findUnique({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Module "${moduleKey}" is not activated`);
    }

    return this.prisma.providerModule.update({
      where: {
        providerId_moduleKey: { providerId, moduleKey },
      },
      data: { config },
    });
  }
}
