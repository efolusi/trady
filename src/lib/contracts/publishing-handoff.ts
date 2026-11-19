import { z } from 'zod'

const uuid = z.string().uuid()
const digest = z.string().regex(/^[a-f0-9]{64}$/)

export const PUBLISHING_HANDOFF_VERSION = 1 as const
export const PUBLISHING_HANDOFF_CONSUMER = 'kongkow' as const
export const PUBLISHING_HANDOFF_SCOPES = {
  read: 'publishing-handoff:read',
  consume: 'publishing-handoff:consume',
} as const
export const PUBLISHING_HANDOFF_ARTIFACT_MEDIA_TYPE =
  'application/vnd.efolusi.trady-publishing-handoff+json' as const
export const publishingRightsBasisSchema = z.enum(['owned', 'licensed', 'authorized'])

export const publishingHandoffManifestSchema = z.object({
  version: z.literal(PUBLISHING_HANDOFF_VERSION),
  handoffId: uuid,
  tenantId: uuid,
  projectId: uuid,
  clipId: uuid,
  artifactId: uuid,
  artifactDigestSha256: digest,
  artifactMimeType: z.string().min(1),
  caption: z.string().max(2200),
  rights: z.object({
    basis: publishingRightsBasisSchema,
    source: z.string().min(1).max(200),
    assertedByUserId: uuid,
    assertedAt: z.string().datetime(),
  }),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  revokedAt: z.string().datetime().nullable(),
  manifestDigestSha256: digest,
})
export type PublishingHandoffManifest = z.infer<typeof publishingHandoffManifestSchema>

/** Exact ordered document hashed for manifestDigestSha256. */
export function publishingHandoffDigestPayload(
  manifest: Omit<PublishingHandoffManifest, 'manifestDigestSha256'>,
): Omit<PublishingHandoffManifest, 'manifestDigestSha256'> {
  return {
    version: manifest.version,
    handoffId: manifest.handoffId,
    tenantId: manifest.tenantId,
    projectId: manifest.projectId,
    clipId: manifest.clipId,
    artifactId: manifest.artifactId,
    artifactDigestSha256: manifest.artifactDigestSha256,
    artifactMimeType: manifest.artifactMimeType,
    caption: manifest.caption,
    rights: manifest.rights,
    issuedAt: manifest.issuedAt,
    expiresAt: manifest.expiresAt,
    revokedAt: manifest.revokedAt,
  }
}

export const publishingHandoffReceiptSchema = z.object({
  handoffId: uuid,
  consumer: z.string().min(1).max(100),
  idempotencyKey: z.string().min(8).max(255),
  manifestDigestSha256: digest,
  receiptDigestSha256: digest,
  receivedAt: z.string().datetime(),
})
export type PublishingHandoffReceipt = z.infer<typeof publishingHandoffReceiptSchema>

export const createPublishingHandoffRequestSchema = z.object({
  caption: z.string().max(2200),
  rights: z.object({ basis: publishingRightsBasisSchema, source: z.string().min(1).max(200) }),
  expiresInSeconds: z.number().int().min(60).max(3600).default(900),
})
export type CreatePublishingHandoffRequest = z.infer<typeof createPublishingHandoffRequestSchema>

export const consumePublishingHandoffRequestSchema = z.object({
  consumer: z.literal(PUBLISHING_HANDOFF_CONSUMER),
  idempotencyKey: z.string().min(8).max(255),
  manifestDigestSha256: digest,
})
export type ConsumePublishingHandoffRequest = z.infer<typeof consumePublishingHandoffRequestSchema>

export const publishingHandoffResponseSchema = publishingHandoffManifestSchema
export const publishingHandoffReceiptResponseSchema = publishingHandoffReceiptSchema

export const consumePublishingHandoffResponseSchema = z.object({
  receipt: publishingHandoffReceiptSchema,
  artifact: z.object({
    url: z.string().url(),
    expiresAt: z.string().datetime(),
    digestSha256: digest,
    mimeType: z.string().min(1),
  }),
})
export type ConsumePublishingHandoffResponse = z.infer<
  typeof consumePublishingHandoffResponseSchema
>
