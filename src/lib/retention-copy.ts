/**
 * What the project screen says about deleting and expiring media.
 *
 * Both lines have to match what the code does, which today is: deleting a
 * project only marks it deleted (packages/persistence/src/projects.ts,
 * softDeleteProject), and nothing reads `projects.expires_at` to remove media.
 * There is no purge worker. The privacy page says the same thing in
 * legal.privacy.sections.retention, and these strings must not promise more
 * than that section does. If a purge ships, change both together.
 */

const SUPPORT_EMAIL = 'hi@efolusi.com'

export const DELETE_PROJECT_DESCRIPTION =
  'The project is marked deleted and leaves your workspace right away. Its source video and rendered clips are not erased automatically yet. ' +
  `To have them erased, write to ${SUPPORT_EMAIL}. Clips you have already downloaded are unaffected.`

export function retentionNotice(expiresOn: string): string {
  return (
    `This project is marked to expire on ${expiresOn}. There is no automatic purge yet, so its media is not removed on that date, ` +
    'but keep your own copy of anything you want to keep.'
  )
}
