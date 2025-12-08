import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

const prisma = globalThis.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export default prisma

// Helper functions for database operations
export const db = {
  // User operations
  async createUser(email: string, password: string, role: 'ADMIN' | 'OPERATOR' | 'VIEWER' | 'GUEST' = 'USER') {
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 12)

    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    })
  },

  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    })
  },

  async updateUserLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    })
  },

  // Target operations
  async createTarget(type: 'IP' | 'ENDPOINT', value: string, description: string | null, createdById: string) {
    return prisma.target.create({
      data: {
        type,
        value,
        description,
        createdById,
      },
    })
  },

  async getTargetsByUserId(userId: string) {
    return prisma.target.findMany({
      where: {
        createdById: userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  },

  async updateTarget(id: string, data: { value?: string; description?: string | null; isActive?: boolean }) {
    return prisma.target.update({
      where: { id },
      data,
    })
  },

  async deleteTarget(id: string) {
    return prisma.target.update({
      where: { id },
      data: { isActive: false },
    })
  },

  // Scan session operations
  async createScanSession(token: string, userId: string, mode: 'STANDARD' | 'AI', targetIds: string[]) {
    return prisma.scanSession.create({
      data: {
        token,
        userId,
        mode,
        status: 'QUEUED',
        totalTargets: targetIds.length,
        createdById: userId,
        targets: {
          connect: targetIds.map(id => ({ id })),
        },
      },
      include: {
        targets: true,
        createdBy: true,
      },
    })
  },

  async updateScanSession(token: string, data: {
    status?: 'QUEUED' | 'RUNNING' | 'COMPLETE' | 'FAILED'
    completedTargets?: number
    startedAt?: Date
    finishedAt?: Date
    errorMessage?: string | null
  }) {
    return prisma.scanSession.update({
      where: { token },
      data,
    })
  },

  async getScanSession(token: string) {
    return prisma.scanSession.findUnique({
      where: { token },
      include: {
        targets: true,
        results: true,
        createdBy: true,
      },
    })
  },

  async getUserScanSessions(userId: string, limit = 10) {
    return prisma.scanSession.findMany({
      where: { userId },
      include: {
        targets: true,
        _count: {
          select: { results: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  },

  // Scan result operations
  async createScanResult(data: {
    targetId: string
    sessionId?: string
    target: string
    ipAddress?: string | null
    status: string
    responseTime?: number | null
    location?: any
    provider?: string | null
    openPorts?: number[]
    riskLevel?: string
    riskSummary?: string | null
    recommendation?: string | null
    accessibilityTests?: any
    geminiAnalysis?: any
  }) {
    return prisma.scanResult.create({
      data,
    })
  },

  async getScanResultsBySession(sessionToken: string) {
    return prisma.scanResult.findMany({
      where: { sessionToken },
      include: {
        target: true,
      },
      orderBy: {
        scannedAt: 'desc',
      },
    })
  },

  // Session operations
  async createUserSession(userId: string, token: string, expiresAt: Date) {
    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    })
  },

  async findSession(token: string) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    })
  },

  async deleteSession(token: string) {
    return prisma.session.delete({
      where: { token },
    })
  },

  async deleteExpiredSessions() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  },

  // Audit log operations
  async createAuditLog(data: {
    userId: string
    action: string
    resource?: string | null
    resourceId?: string | null
    metadata?: any
    ipAddress?: string | null
    userAgent?: string | null
  }) {
    return prisma.auditLog.create({
      data,
    })
  },

  async getUserAuditLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  },

  // Settings operations
  async getSetting(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
    })
    return setting?.value
  },

  async setSetting(key: string, value: any) {
    return prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  },

  // Public data operations (for guest interface)
  async getPublicTargetSummary() {
    const totalTargets = await prisma.target.count({
      where: { isActive: true },
    })

    const ipCount = await prisma.target.count({
      where: {
        type: 'IP',
        isActive: true,
      },
    })

    const endpointCount = await prisma.target.count({
      where: {
        type: 'ENDPOINT',
        isActive: true,
      },
    })

    const targets = await prisma.target.findMany({
      where: { isActive: true },
      select: {
        type: true,
        value: true,
        description: true,
      },
    })

    return {
      total_targets: totalTargets,
      ip_addresses: ipCount,
      endpoints: endpointCount,
      targets: targets.map(t => ({
        type: t.type.toLowerCase(),
        value: t.value,
        description: t.description,
      })),
    }
  },

  // Cleanup operations
  async cleanupOldScanResults(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return prisma.scanResult.deleteMany({
      where: {
        scannedAt: {
          lt: cutoffDate,
        },
      },
    })
  },
}

export type Database = typeof db