import { z } from 'zod'

const uuid = z.string().uuid()
const sha256 = z.string().regex(/^[0-9a-f]{64}$/)
const fullSha = z.string().regex(/^[0-9a-f]{40}$/)
const digest = z.string().regex(/^sha256:[0-9a-f]{64}$/)
const effectId = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[^*\s]+$/)
const safeEvidencePath = z
  .string()
  .min(1)
  .refine(
    (value) => !value.startsWith('/') && !value.split('/').includes('..'),
    'unsafe evidence path',
  )
const namespace = z
  .string()
  .regex(
    /^qa-live-e2e\/\d{8}\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )

const sortedUniqueSessionIds = z
  .array(uuid)
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, 'duplicate synthetic session ID')
  .refine(
    (ids) => JSON.stringify(ids) === JSON.stringify([...ids].sort()),
    'synthetic session IDs must be sorted',
  )

export const syntheticSessionCreationReceiptSchema = z
  .object({
    schemaVersion: z.literal('trady.synthetic-session-creation.v1'),
    runId: uuid,
    primaryUserId: uuid,
    sessionIds: sortedUniqueSessionIds,
    createdAt: z.string().datetime({ offset: true }),
    receiptDigest: sha256,
  })
  .strict()

const artifact = z.object({
  sourceSha: fullSha,
  artifactDigest: digest,
  rollbackArtifactDigest: digest,
  role: z.string().min(1),
  schemaVersion: z.string().min(1),
  configDigest: digest,
  provenanceDigest: digest,
  observedAt: z.string().datetime({ offset: true }),
  evidencePath: safeEvidencePath,
})

export const syntheticReleaseSetSchema = z.object({
  web: artifact.extend({ deploymentVersionId: z.string().min(1) }),
  api: artifact,
  media: artifact,
  render: artifact,
  ai: artifact,
  orchestrator: artifact,
})

export const syntheticRunManifestSchema = z
  .object({
    suiteVersion: z.string().min(1),
    recordId: z.string().min(1),
    startedAt: z.string().datetime({ offset: true }),
    observedAt: z.string().datetime({ offset: true }),
    runId: uuid,
    namespace,
    primaryIdentityRegisterRef: z.string().min(1),
    denialPrincipalRef: z.string().min(1),
    primaryTenantId: uuid,
    denialTenantId: uuid,
    primaryUserId: uuid,
    sessionInventorySource: z.literal('synthetic-session-creation'),
    sessionIds: sortedUniqueSessionIds,
    sessionCreationReceipt: syntheticSessionCreationReceiptSchema,
    projectId: uuid,
    projectExternalRef: z.string().startsWith('[TRADY-E2E] '),
    idempotencyKeyCreate: z.string().startsWith('trady-e2e:'),
    idempotencyKeyCleanup: z.string().startsWith('trady-e2e:'),
    sourceAssetSha256: sha256,
    sourceObjectKey: z.string().min(1),
    clipIds: z.array(uuid).min(1),
    renderObjectKeys: z.array(effectId).min(1),
    queueJobIds: z.array(effectId).min(1),
    providerRequestIds: z.array(effectId),
    creditReservationIds: z.array(uuid),
    ledgerEntryIds: z.array(uuid),
    effectPolicy: z.object({
      providerMode: z.literal('no-call'),
      creditMode: z.literal('no-charge'),
      expectedProviderRequests: z.literal(0),
      expectedCreditReservations: z.literal(0),
      expectedLedgerEntries: z.literal(0),
    }),
    correlationId: uuid,
    releaseSet: syntheticReleaseSetSchema,
    cleanupQueryProof: z.object({
      reviewed: z.literal(true),
      tenantId: uuid,
      namespace,
      testRunId: uuid,
      queryDigest: digest,
    }),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.primaryTenantId === value.denialTenantId) {
      ctx.addIssue({
        code: 'custom',
        path: ['denialTenantId'],
        message: 'denial tenant must differ',
      })
    }
    if (
      value.sessionCreationReceipt.runId !== value.runId ||
      value.sessionCreationReceipt.primaryUserId !== value.primaryUserId ||
      JSON.stringify(value.sessionCreationReceipt.sessionIds) !== JSON.stringify(value.sessionIds)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['sessionCreationReceipt'],
        message: 'synthetic session creation receipt scope mismatch',
      })
    }
    const sessionCreatedAt = Date.parse(value.sessionCreationReceipt.createdAt)
    if (
      sessionCreatedAt < Date.parse(value.startedAt) ||
      sessionCreatedAt > Date.parse(value.observedAt)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['sessionCreationReceipt', 'createdAt'],
        message: 'synthetic session creation outside run chronology',
      })
    }
    if (Date.parse(value.observedAt) < Date.parse(value.startedAt)) {
      ctx.addIssue({
        code: 'custom',
        path: ['observedAt'],
        message: 'observation predates start',
      })
    }
    const run = value.runId.toLowerCase()
    if (!value.namespace.toLowerCase().endsWith(`/${run}`)) {
      ctx.addIssue({
        code: 'custom',
        path: ['namespace'],
        message: 'namespace/run mismatch',
      })
    }
    for (const key of [value.idempotencyKeyCreate, value.idempotencyKeyCleanup]) {
      if (!key.includes(run))
        ctx.addIssue({
          code: 'custom',
          message: 'idempotency key/run mismatch',
        })
    }
    if (
      value.sourceObjectKey.includes('*') ||
      value.renderObjectKeys.some((key) => key.includes('*'))
    ) {
      ctx.addIssue({ code: 'custom', message: 'wildcards are forbidden' })
    }
    const objectPrefix = `${value.primaryTenantId}/${value.projectId}/`
    if (
      !value.sourceObjectKey.startsWith(objectPrefix) ||
      value.renderObjectKeys.some((key) => !key.startsWith(objectPrefix))
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'object key tenant/project binding mismatch',
      })
    }
    const inventories = [value.clipIds, value.renderObjectKeys, value.queueJobIds, value.sessionIds]
    if (inventories.some((ids) => new Set(ids).size !== ids.length)) {
      ctx.addIssue({
        code: 'custom',
        message: 'duplicate immutable effect ID',
      })
    }
    if (
      value.providerRequestIds.length !== value.effectPolicy.expectedProviderRequests ||
      value.creditReservationIds.length !== value.effectPolicy.expectedCreditReservations ||
      value.ledgerEntryIds.length !== value.effectPolicy.expectedLedgerEntries
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'effect inventory contradicts no-effect policy',
      })
    }
    if (
      value.cleanupQueryProof.tenantId !== value.primaryTenantId ||
      value.cleanupQueryProof.testRunId !== value.runId ||
      value.cleanupQueryProof.namespace !== value.namespace
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['cleanupQueryProof'],
        message: 'cleanup query scope mismatch',
      })
    }
    for (const item of Object.values(value.releaseSet)) {
      const observed = Date.parse(item.observedAt)
      if (observed < Date.parse(value.startedAt) || observed > Date.parse(value.observedAt)) {
        ctx.addIssue({
          code: 'custom',
          message: 'artifact observation outside run chronology',
        })
      }
    }
  })

export const syntheticResidueReportSchema = z.object({
  runId: uuid,
  operational: z.object({
    dbRows: z.number().int().nonnegative(),
    objects: z.number().int().nonnegative(),
    multipartUploads: z.number().int().nonnegative(),
    jobs: z.number().int().nonnegative(),
    openReservations: z.number().int().nonnegative(),
    providerArtifacts: z.number().int().nonnegative(),
    sessions: z.number().int().nonnegative(),
  }),
  dangling: z.object({
    dbToObject: z.number().int().nonnegative(),
    objectToDb: z.number().int().nonnegative(),
  }),
  retained: z.array(
    z.object({
      system: z.string(),
      id: z.string(),
      owner: z.string(),
      expiresAt: z.string().datetime(),
      inert: z.literal(true),
      containsSecret: z.literal(false),
      containsMedia: z.literal(false),
    }),
  ),
  verifiedAt: z.string().datetime(),
})

export const syntheticCleanupReceiptSchema = z.object({
  runId: uuid,
  projectId: uuid,
  idempotencyKey: z.string().startsWith('trady-e2e:'),
  requestHash: sha256,
  receiptDigest: sha256,
  attempt: z.number().int().positive(),
  replayed: z.boolean(),
  result: z.enum(['PASS', 'BLOCKED', 'FAIL']),
  residue: syntheticResidueReportSchema,
  completedAt: z.string().datetime(),
  provenance: z.object({
    envelopeType: z.literal('application/vnd.in-toto+json'),
    algorithm: z.literal('Ed25519'),
    keyId: digest,
    payloadDigest: digest,
    envelopeDigest: digest,
    verificationPolicyId: z.string().min(1),
    signature: z.string().regex(/^[A-Za-z0-9_-]+$/),
  }),
})

export type SyntheticRunManifest = z.infer<typeof syntheticRunManifestSchema>
export type SyntheticSessionCreationReceipt = z.infer<typeof syntheticSessionCreationReceiptSchema>
export type SyntheticResidueReport = z.infer<typeof syntheticResidueReportSchema>
export type SyntheticCleanupReceipt = z.infer<typeof syntheticCleanupReceiptSchema>
