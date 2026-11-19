/**
 * Marketing copy in the two languages Trady sells in.
 *
 * Only the signed-out site is translated. The app itself stays in English for
 * now, and that is a decision rather than an omission: a half-translated
 * workspace — English status words beside Indonesian labels — reads worse than
 * an English one, and the strings there are still moving.
 *
 * Numbers never live here. Every measured figure comes from the episode
 * fixture, so a translation cannot quietly change what the page claims.
 */

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * One block of a legal document.
 *
 * Deliberately three shapes with no discriminant field: a `kind: 'paragraph'`
 * string would be a leaf the shape test walks and the untranslated-ratio test
 * counts, and there would be one of them per paragraph. `'p' in block` reads
 * the same and costs nothing.
 */
export type LegalBlock = { p: string } | { h3: string } | { list: string[] }

/**
 * A legal document, as data.
 *
 * The prose used to be JSX inside the page components, which made /id/privacy
 * impossible without duplicating the markup. It is strings here instead, and
 * the handful of things that are not prose (a link, a bolded lead-in, the one
 * measured number, the address that is still a placeholder) are `{tokens}`
 * substituted at render by LegalDocument. The tokens are:
 *
 *   {email}          the support address, as a mailto link
 *   {privacyLink}    a link to the privacy page in the reader's language
 *   {sessionDays}    the session lifetime, from SESSION_LIFETIME_DAYS
 *   {address}        the registered address of PT Efolusi Dunia Teknologi
 *   {openRouterLead} the bolded "OpenRouter." that opens its paragraph
 *
 * Sections are keyed by their anchor id rather than carrying one as a field,
 * for the same reason the blocks have no discriminant: the id is the same in
 * both languages by design, and a key is part of the path the shape test
 * compares rather than a value the ratio test scores as untranslated.
 */
export interface LegalDoc {
  /** The <title>, which is the tab and the search result. */
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  lede: string
  /** The paragraphs of the honest note above the body. */
  note: string[]
  sections: Record<string, { title: string; blocks: LegalBlock[] }>
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'id'
}

/** The request header the middleware uses to tell the render its language. */
export const LOCALE_HEADER = 'x-locale'

/**
 * The language a request is in, from the `x-locale` header the middleware sets
 * for anything under /en or /id.
 *
 * The root layout is shared by every route and hardcoded "en", so an
 * Indonesian page shipped `<html lang="en">`: screen readers read Indonesian
 * text with English phonetics and search engines indexed it as English. The
 * layout has no params to read, so the header is the only signal it gets on
 * the first server response. English is the fallback because everything
 * outside the two language subtrees (the app, /signin, the unprefixed legal
 * pages kept for old links) is still English.
 */
export function localeFromHeader(value: string | undefined | null): Locale {
  return isLocale(value) ? value : 'en'
}

export interface Dictionary {
  htmlLang: string
  /** The skip link, the first thing a keyboard user reaches on every page. */
  skipToContent: string
  nav: {
    features: string
    how: string
    pricing: string
    signIn: string
    signUp: string
    signUpShort: string
    open: string
  }
  hero: {
    eyebrow: string
    /**
     * The headline, one entry per caption beat. `box` marks the one word set in
     * a caption box, the way the product highlights the word being spoken.
     *
     * Data rather than a function on purpose: this dictionary is handed to
     * client components, and React cannot serialise a function across that
     * boundary — the build failed on exactly that.
     *
     * No measured number lives in the headline. The selection figure below it
     * is an illustrative fixture, and a headline that states its numbers as a
     * run Trady did would be claiming a result nobody measured.
     */
    headline: Array<{ text: string; box?: boolean }>
    lede: string
    ctaPrimary: string
    ctaSecondary: string
    chips: string[]
    /** Label on the selection figure, which says plainly that it is an example. */
    figureLabel: string
    /** The figure's step buttons, the finger-sized way to move between moments. */
    previousMoment: string
    nextMoment: string
  }
  stack: { title: string; lede: string }
  find: { title: string; body: string; figure: string }
  captions: { title: string; body: string; figure: string }
  reframe: { title: string; body: string }
  how: {
    eyebrow: string
    title: string
    steps: Array<{ time: string; title: string; body: string }>
  }
  faq: { eyebrow: string; title: string; items: Array<{ question: string; answer: string }> }
  close: { title: string; body: string; cta: string }
  /**
   * The pricing page's own copy.
   *
   * It used to be hardcoded English inside PricingScreen, so /id/pricing served
   * Indonesian navigation wrapped around an English page. The plan names and
   * prices still come from the API; only the sentences around them live here.
   */
  pricing: {
    title: string
    lede: string
    /** Shown in place of the plans when the API cannot be reached. */
    unavailable: string
    /** Feature keys the API stores, as sentences a buyer can read. */
    features: Record<string, string>
    /**
     * Badge for a listed feature that is not shippable yet, so it is never read
     * as something the plan buys today. See UNSHIPPED_FEATURES in
     * lib/unshipped-features.ts for which keys carry it and why.
     */
    comingSoon: string
    /**
     * A paid plan's minutes. `{minutes}` is substituted. Billing is a single
     * payment that credits the minutes once, so this must never say monthly.
     */
    creditsOnce: string
    /** The free plan's minutes, granted once when the workspace is created. */
    creditsOnSignup: string
    /** How buying a plan works: one payment, no renewal. Shown under the plans. */
    billingNote: string
    /** Shown while seed-plans.ts prices are provisional; remove when committed. */
    provisionalNote: string
    startFree: string
    faqTitle: string
    faq: Array<{ question: string; answer: string }>
  }
  /** `{year}` is substituted at render; see the note above about functions. */
  footer: {
    tagline: string
    product: string
    legal: string
    pricing: string
    privacy: string
    terms: string
    rights: string
    madeIn: string
  }
  languageName: string
  switchTo: string
  /**
   * The sign-in hand-off screen. It has no form: Efolusi products share one
   * sign-in page, so this is only the few seconds before the redirect. Short,
   * but it is still the first thing a signed-out visitor reads.
   */
  signInScreen: {
    title: string
    redirecting: string
    unreachable: string
    retry: string
    signedOut: string
    signIn: string
  }
  /**
   * The two legal documents, and the chrome around them.
   *
   * `governingNote` is rendered only on a translated route. English is the
   * text that binds, so saying so on the English page would be noise, but the
   * English wording lives here anyway: it is what the Indonesian sentence is a
   * translation of, and a translator with only the Indonesian has nothing to
   * check against.
   */
  legal: {
    lastUpdated: string
    governingNote: string
    /** The link text for {privacyLink}, used inside the terms. */
    privacyLinkLabel: string
    privacy: LegalDoc
    terms: LegalDoc
  }
}

const en: Dictionary = {
  htmlLang: 'en',
  skipToContent: 'Skip to content',
  nav: {
    features: 'Features',
    how: 'How it works',
    pricing: 'Pricing',
    signIn: 'Sign in',
    signUp: 'Start free',
    signUpShort: 'Sign up',
    open: 'Open Trady',
  },
  hero: {
    eyebrow: 'Transcribe · Score · Caption',
    headline: [
      { text: 'Turn' },
      { text: 'long' },
      { text: 'recordings' },
      { text: 'into' },
      { text: 'short,' },
      { text: 'captioned', box: true },
      { text: 'clips.' },
    ],
    lede: 'Give Trady one podcast, interview or webinar and get back vertical clips with word-timed captions, each with its score and timecode.',
    ctaPrimary: 'Start free',
    ctaSecondary: 'See how it works',
    chips: ['Word-timed captions', '9:16 vertical', 'Scored picks', 'MP4 · SRT · VTT'],
    figureLabel: 'Example selection · illustrative episode',
    previousMoment: 'Previous moment',
    nextMoment: 'Next moment',
  },
  stack: {
    title: 'Real clips, not a mockup.',
    // Says what is on the rail and nothing more. The rail holds clips from two
    // different recordings, all spoken in Indonesian; copy that miscounts what
    // the reader can see is the fastest way to lose them.
    lede: 'Every clip below came out of Trady, in the language it was spoken in. Play one and judge the captions and framing yourself.',
  },
  find: {
    title: 'Every pick comes with a score.',
    body: 'Trady reads the whole transcript, scores each candidate from 0 to 99 and tags what kind of moment it is. You review the shortlist with timecodes before you post anything.',
    figure: 'Example shortlist, top five by score.',
  },
  captions: {
    title: 'Captions land on the word.',
    body: 'Transcription keeps the timing of every word, so each caption appears as it is said. The same timing exports as SRT and VTT.',
    figure: 'A real clip, cut and captioned by Trady. The lit word is the one being said.',
  },
  reframe: {
    title: 'Wide in, vertical out.',
    body: 'On Pro and Business, the 9:16 crop follows the movement in frame, so the person talking stays in shot instead of the middle of the room. Other plans crop from the centre. Cuts fall where the moment starts and ends, not on a round number of seconds.',
  },
  how: {
    eyebrow: 'How it works',
    title: 'Three steps from upload to clip.',
    steps: [
      {
        time: 'Step 1',
        title: 'Add one long video',
        body: 'Paste a video URL or upload a file: a podcast, interview, stream or webinar.',
      },
      {
        time: 'Step 2',
        title: 'Trady finds the moments',
        body: 'It transcribes with word-level timing, scores every candidate moment and renders the ones worth keeping.',
      },
      {
        time: 'Step 3',
        title: 'Review, then download',
        body: 'Every clip shows its score, category and timecode. Download the MP4 with matching SRT and VTT files.',
      },
    ],
  },
  faq: {
    eyebrow: 'Questions',
    title: 'What people ask first.',
    items: [
      {
        question: 'What does Trady do?',
        answer:
          'Trady takes one long video and returns short vertical clips with word-by-word captions. It reads the transcript, picks the moments worth cutting and renders each one ready to post.',
      },
      {
        question: 'What can I give it?',
        answer:
          'A podcast, interview, stream, webinar or talk, as a file you upload or a video URL you paste. It works from the audio and the transcript, so a recording of people talking is its best case.',
      },
      {
        question: 'Does it understand Indonesian?',
        answer:
          'Yes. Transcription and moment selection both run on Indonesian audio, and clip titles come back in the language the video is spoken in.',
      },
      {
        question: 'How long does a video take?',
        answer:
          'It depends on the length of the source. Transcription and scoring are the quick part; most of the wait is rendering each clip with its captions burned in. The project page shows each stage as it runs.',
      },
      {
        question: 'How is Trady priced?',
        answer:
          'Per minute of source video, not per clip. An episode costs the same whether Trady finds thirty moments in it or four, and a run that finds nothing worth clipping is never billed. Minutes come from a plan you buy once, not a subscription.',
      },
      {
        question: 'What do I get back?',
        answer:
          'Each clip exports as a vertical 9:16 MP4 with captions burned in, plus matching SRT and VTT subtitle files. Every clip carries its score, category and timecode.',
      },
    ],
  },
  close: {
    title: 'Point it at your last episode.',
    body: 'You see every moment it picked, with its score and timecode, before you post anything.',
    cta: 'Start free',
  },
  pricing: {
    title: 'Pricing',
    lede: 'Every plan does the same thing: long video in, vertical captioned clips out. You are charged per minute of source video, and a run that finds nothing worth clipping is never billed.',
    unavailable: 'Plans and prices could not be loaded just now. Please try again in a few minutes.',
    features: {
      url_ingest: 'Paste a video URL to start',
      manual_upload: 'Upload video files directly',
      captions: 'Word-by-word captions',
      face_tracking: 'Vertical reframing that follows the speaker',
      social_publishing: 'Publish straight to your channels (coming soon)',
    },
    comingSoon: 'Coming soon',
    creditsOnce: '{minutes} minutes of source video, paid once',
    creditsOnSignup: '{minutes} minutes of source video when you sign up',
    billingNote:
      'Plans are not subscriptions. Buying one is a single payment that adds its minutes to your balance and moves your workspace onto that plan. Nothing renews, and you are not charged again unless you buy again.',
    provisionalNote:
      'Paid plan prices are introductory and may change. Checkout is offered only when Efolusi Pay is enabled for this environment.',
    startFree: 'Start free',
    faqTitle: 'Questions',
    faq: [
      {
        question: 'What does Trady do?',
        answer:
          'Trady takes one long video and returns short vertical clips with word-by-word captions. It reads the transcript, picks the moments worth cutting, and renders each one ready to post.',
      },
      {
        question: 'How is Trady priced?',
        answer:
          'You are charged per minute of source video, not per clip. Minutes come from a plan you buy once: there is no subscription and nothing renews. A run that finds nothing worth clipping is never billed, and if a run fails on our side the credits return to your balance automatically.',
      },
      {
        question: 'What do I get to download?',
        answer:
          'Each clip exports as a vertical MP4, with matching SRT and VTT caption files so you can re-caption or translate it elsewhere.',
      },
      {
        question: 'What aspect ratio are the clips?',
        answer:
          'Clips are rendered vertically at 9:16, the format TikTok, Instagram Reels and YouTube Shorts expect.',
      },
      {
        question: 'Is my video kept private?',
        answer:
          'Each workspace is isolated by Postgres row-level security and the site is served over HTTPS, and your videos are never used to train any model of ours. To build the transcript, your audio and the words in it are sent to OpenRouter; the privacy page lists exactly what leaves the server.',
      },
    ],
  },
  footer: {
    tagline: 'Turn long recordings into short, captioned clips. Built by Efolusi.',
    product: 'Product',
    legal: 'Legal',
    pricing: 'Pricing',
    privacy: 'Privacy',
    terms: 'Terms',
    rights: '© {year} PT Efolusi Dunia Teknologi. All rights reserved.',
    madeIn: 'Made in Indonesia',
  },
  languageName: 'English',
  switchTo: 'Ganti ke Bahasa Indonesia',
  signInScreen: {
    title: 'Sign in',
    redirecting: 'Taking you to your Efolusi account…',
    unreachable: 'Could not reach the sign-in service.',
    retry: 'Try again',
    signedOut: 'You are signed out of Trady.',
    signIn: 'Sign in again',
  },
  legal: {
    lastUpdated: 'Last updated',
    governingNote:
      'This is a translation. If it disagrees with the English version, the English version governs.',
    privacyLinkLabel: 'privacy page',
    /**
     * Every claim on this page is a claim about code that exists.
     *
     *   sign-in via Efolusi SSO        apps/api/src/auth/session.ts, users.sso_user_id
     *   SHA-256 session token digests  apps/api/src/adapters/db-accounts.ts
     *   14 day session lifetime        apps/api/src/auth/session.ts (SESSION_TTL_SECONDS)
     *   row level security per tenant  packages/db/src/rls.ts
     *   object storage buckets         .env.example (S3_BUCKET_MEDIA, S3_BUCKET_RENDERS)
     *   OpenRouter for ASR and the LLM .env.example (OPENROUTER_ASR_MODEL, OPENROUTER_LLM_MODEL)
     *   ...reached through Relay       packages/pipeline/src/llm-endpoint.ts (RELAY_API_URL)
     *   Cloudflare in front, country   apps/web/src/middleware.ts (cf-ipcountry)
     *   Sentry, server side, no PII    apps/api/src/observability.ts, packages/jobs/src/observability.ts
     *   link ingest with yt-dlp        packages/pipeline/src/ingest/source.ts
     *   Composio for channel connect   apps/api/src/adapters/composio-connector.ts (UI withheld,
     *                                  apps/web/src/lib/unshipped-features.ts)
     *   delete marks, does not erase   packages/persistence/src/projects.ts (softDeleteProject)
     *
     * If one of those changes, this page is wrong and has to change with it,
     * in BOTH languages. The Indonesian below is a translation and nothing
     * more: it must not soften a claim, drop a number, or promise anything the
     * English does not.
     */
    privacy: {
      metaTitle: 'Privacy',
      metaDescription:
        'What Trady collects, where it is stored, who else sees it, and how long it is kept.',
      eyebrow: 'Legal',
      title: 'Privacy',
      lede: 'What we collect, where it is kept, who else sees it, and how to get it removed.',
      note: [
        'Trady is new, and this page describes what the software does today rather than what we plan for it. Where something is not automated yet, it says so instead of promising a schedule.',
        'This page will change as the product does. Questions go to {email}.',
      ],
      sections: {
        'what-we-collect': {
          title: 'What we collect',
          blocks: [
            {
              p: 'Only what the product needs to run. There is no analytics service, no advertising code and no third party tracker on this site.',
            },
            { h3: 'Your account' },
            {
              list: [
                'An email address, which comes from your Efolusi account and is the only way we can reach you.',
                'No password. You sign in at my.efolusi.com, so a Trady password is never typed, sent or stored here. There is no password field in our database to leak.',
                'Sessions. When you sign in, your browser gets a random token in one cookie. The server keeps only a SHA-256 digest of that token, so a copy of the database does not let anyone sign in as you. A session lasts {sessionDays} days, and signing out revokes it immediately.',
              ],
            },
            { h3: 'What you upload and what we make from it' },
            {
              list: [
                'The video files you submit.',
                'The transcript we derive from each video, including the timing of individual words, because that is what word by word captions are made of.',
                'The moments we select, with their scores and categories, and the vertical clips we render from them.',
              ],
            },
            { h3: 'Running the account' },
            {
              list: [
                'A credit ledger. Every charge, release and top up is an entry with a timestamp, so your balance can always be explained line by line.',
                'An audit record of privileged actions, such as creating or deleting a project: who did it, when, and what changed.',
                'Ordinary server logs, which include IP addresses and request paths, kept for debugging and abuse handling.',
              ],
            },
          ],
        },
        'where-it-goes': {
          title: 'Where it is stored',
          blocks: [
            {
              p: 'Trady runs on a single server. Account data, projects, transcripts, clip metadata and the credit ledger live in one PostgreSQL database. Video files and rendered clips live in MinIO object storage on the same machine.',
            },
            {
              p: 'Every table that holds workspace data carries a workspace id and is protected by Postgres row level security, so a query made on behalf of one workspace cannot read another workspace’s rows even if the application code asks it to. Traffic to the site is served over HTTPS.',
            },
          ],
        },
        'who-else-sees-it': {
          title: 'Who else sees it',
          blocks: [
            {
              p: 'A few companies outside our server handle part of the work. This is the full list of what leaves the machine and who receives it.',
            },
            { h3: 'Transcripts and clip selection' },
            {
              p: '{openRouterLead} We send the audio of your video to a speech to text model to produce the transcript, and we send the resulting transcript text to a language model to pick the moments worth cutting. Both requests go through Relay, the AI gateway Efolusi runs, which passes them on to OpenRouter. That means your audio and the words spoken in your video leave our server and are processed by OpenRouter and by the model provider behind the model in use.',
            },
            {
              p: 'We do not control how OpenRouter or its upstream providers handle what they receive. Their own terms and privacy policies govern that, and if the content of a video makes this a problem, do not upload it.',
            },
            { h3: 'Cloudflare' },
            {
              p: 'The site is served through Cloudflare, which acts as our content delivery network and protects the site from attacks. Cloudflare sees your IP address and the requests your browser makes to the site. It also tells our server which country a request comes from, and we use that only to choose between the English and Indonesian pages.',
            },
            { h3: 'Videos you add by link' },
            {
              p: 'When you add a video by pasting a link instead of uploading a file, our server downloads it from the site you linked, such as YouTube, Vimeo, Google Drive or Dropbox, using the open source tool yt-dlp. That site receives a request from our server for the video, and its own terms and privacy policy apply. Only link to videos you have the right to use.',
            },
            { h3: 'Error reports' },
            {
              p: 'When our API or our processing workers hit an error, a report goes to Sentry so we can fix it. A report holds the error itself, where in the service it happened, a request or job id and your workspace id. It is set up not to attach cookies, sign-in tokens or IP addresses.',
            },
            { h3: 'Channel connections' },
            {
              p: 'Connecting a YouTube or Facebook channel is switched off in Trady today, so nothing about your channels is sent anywhere. The code for it uses Composio, a service that handles the sign-in to the platform. Before it is switched on, this page will say what Composio receives and which YouTube and Google terms apply.',
            },
            {
              p: 'Beyond that: nobody. We do not sell your data, we do not share it with advertisers, and we do not use your videos, transcripts or clips to train any model of our own.',
            },
          ],
        },
        retention: {
          title: 'How long we keep it',
          blocks: [
            {
              p: 'The honest answer is that deletion is manual today, and we would rather say that than publish a retention schedule no code enforces.',
            },
            {
              list: [
                'Deleting a project marks it as deleted and removes it from your workspace. The source video and the rendered clips stay in object storage until someone removes them by hand. There is no automatic purge yet.',
                'Expired and revoked sessions stay as rows until they are cleared manually. They cannot be used to sign in once expired or revoked.',
                'Credit ledger entries and audit records are kept for as long as the account exists, because they are the record of what you were charged and what happened.',
                'If you want your videos, clips and account erased, write to {email} and we will do it by hand and confirm when it is done.',
              ],
            },
          ],
        },
        cookies: {
          title: 'Cookies',
          blocks: [
            {
              p: 'One cookie, set when you sign in, holding the session token described above. It is marked http only so page scripts cannot read it. There are no analytics or advertising cookies, which is why this site has no cookie banner.',
            },
          ],
        },
        payments: {
          title: 'Payments',
          blocks: [
            {
              p: 'When paid checkout is enabled, Trady sends the selected server-priced plan and invoice reference to Efolusi Pay. Pay handles payment details and its underlying providers on its own systems; Trady receives only the settlement evidence needed to credit the correct tenant.',
            },
          ],
        },
        'your-choices': {
          title: 'Your choices',
          blocks: [
            {
              p: 'You can delete a project from the dashboard at any time. For a copy of your data, or for erasure of an account and everything in it, write to {email}. We will answer as a person, not a ticket system.',
            },
            {
              p: 'Trady is not built for children and we do not knowingly collect anything from them.',
            },
          ],
        },
        changes: {
          title: 'Changes to this page',
          blocks: [
            {
              p: 'When what the software does changes, this page changes with it, and the date at the top moves. If a change is significant, such as a new company processing your content, we will email account holders rather than quietly editing the text.',
            },
            { p: 'The operator of Trady is PT Efolusi Dunia Teknologi, at {address}.' },
          ],
        },
      },
    },
    /**
     * Grounded in the same code the privacy document is.
     *
     *   credits are whole seconds of source media, charged once per project
     *                                  packages/persistence/src/credits.ts
     *   a failed run releases the reservation back to the balance
     *                                  packages/persistence/src/credits.ts (releaseReservation)
     *   deleting a project marks it deleted
     *                                  packages/persistence/src/projects.ts
     *   no checkout exists yet         payment will go through Efolusi Pay (unimplemented)
     */
    terms: {
      metaTitle: 'Terms',
      metaDescription:
        'The rules for using Trady: what you may upload, how credits are charged, and how either side ends the arrangement.',
      eyebrow: 'Legal',
      title: 'Terms',
      lede: 'The short version: bring video you have the right to use, we charge credits for the minutes we process, and either of us can walk away.',
      note: [
        'Trady is a young product. These terms describe how it works today, and they will change as it grows. When they do, the date at the top moves and account holders get an email before anything material takes effect.',
        'If a line here is unclear, ask rather than guess: {email}.',
      ],
      sections: {
        'what-this-covers': {
          title: 'What this covers',
          blocks: [
            {
              p: 'These terms apply to Trady, the service at trady.efolusi.com that takes one long video and returns vertical clips with word by word captions. Using the service means you accept them. If you are using Trady for a company, you are confirming you may accept them on that company’s behalf.',
            },
          ],
        },
        'your-account': {
          title: 'Your account',
          blocks: [
            {
              p: 'You need an Efolusi account to use Trady. Sign-in happens at my.efolusi.com, not here. Keep the email address accurate, because it is the only way we can reach you, and keep your Efolusi credentials to yourself. Anything done through your account is treated as done by you, so tell us quickly if you think someone else has gotten in.',
            },
            {
              p: 'Work lives inside a workspace. Anyone you add to a workspace can see and act on the projects in it.',
            },
          ],
        },
        'acceptable-use': {
          title: 'What you may upload',
          blocks: [
            {
              p: 'This is the part that matters most. You must have the right to the video you upload, and the right to have clips made from it.',
            },
            {
              list: [
                'You own the video, or you have permission from whoever does, including permission for the music, footage and voices inside it.',
                'The people recorded in it agreed to be recorded, where their agreement is required.',
                'The content is lawful. No sexual content involving minors, no material that exists to harass or threaten someone, nothing that breaks the law where you are.',
                'You will not use Trady to impersonate someone, to build a deceptive edit of someone else’s words, or to publish something that pretends to be a statement they made.',
              ],
            },
            {
              p: 'You also agree not to attack the service itself: no attempts to reach another workspace’s data, no scraping the site with automated clients, no probing for holes without asking us first. If you find a security problem, tell us at {email} and we will thank you for it.',
            },
          ],
        },
        'your-content': {
          title: 'Who owns what',
          blocks: [
            {
              p: 'Your video is yours. The transcript and the clips made from it are yours. We take only the permission we need to run the service: to store your video, to send its audio and transcript to the processors named in the {privacyLink}, and to produce and hand back the clips.',
            },
            {
              p: 'We do not use your content to promote Trady, and we do not use it to train models of our own.',
            },
            {
              p: 'The sample clips on the front page were cut by Trady from episodes of podcasts made by other people. They are shown only as examples of what the product produces, and the rights in those recordings stay with their owners. If you own one of them and want it taken down, write to {email} and we will remove it.',
            },
            { p: 'Trady itself, the software and the site, stays ours.' },
          ],
        },
        credits: {
          title: 'Credits and billing',
          blocks: [
            {
              p: 'Trady is charged by the length of the video you put in, not by the number of clips it finds. Credits are held as whole seconds of source media, so a sixty minute video costs sixty minutes of credit whether it yields five clips or thirty.',
            },
            {
              list: [
                'The charge is taken once, when the project starts processing, and it is taken once per project. Retrying a project that already charged does not charge again.',
                'If a run fails on our side, the credits go back to your balance automatically.',
                'If your balance is short, the project does not start and we tell you how much is missing. Nothing runs on a negative balance.',
                'Every charge and every release is a line in a ledger you can read on the usage page, so your balance can always be explained.',
              ],
            },
            { h3: 'Buying credits' },
            {
              p: 'A plan is bought once. Its minutes are added to your balance a single time and your workspace moves onto that plan. It is not a subscription, it does not renew, and nothing is charged again unless you buy again.',
            },
            {
              p: 'Paid checkout is offered only when Efolusi Pay is enabled. Trady sends a server-priced plan and immutable invoice reference (never a price supplied by the browser) and applies a verified settlement once. If checkout is unavailable, no charge is attempted. If a balance is wrong, write to us and we will investigate the ledger.',
            },
          ],
        },
        availability: {
          title: 'Availability',
          blocks: [
            {
              p: 'We make no uptime promise. Trady runs on a single server, it is early, and we will take it down to deploy, to migrate the database, or to fix something that is broken. Processing time depends on the length of your video and on services outside our control.',
            },
            {
              p: 'Keep your own copy of any video you care about. Trady is not a backup service, and you should not treat it as the only place a file exists.',
            },
            {
              p: 'The service is provided as it is, without warranties. To the extent the law allows, we are not liable for lost revenue, lost work or lost data, and our total liability for any claim is limited to what you paid us for the service in the three months before it arose.',
            },
          ],
        },
        'ending-it': {
          title: 'Ending it',
          blocks: [
            {
              p: 'You can stop using Trady whenever you want. Ask us to close your account and we will, along with erasing the videos and clips in it, by hand, and we will confirm when it is done.',
            },
            {
              p: 'We can suspend or close an account that breaks the rules above, that is not paying for the minutes it processes, or that is putting the service at risk for everyone else. Unless something is urgent or unlawful, we will tell you what happened and give you a chance to respond first. Unused credits on an account we close for a rule we made up after the fact are refunded; unused credits on an account closed for abuse are not.',
            },
          ],
        },
        changes: {
          title: 'Changes and contact',
          blocks: [
            {
              p: 'We will change these terms as the product changes. The date at the top always says when they last moved, and material changes are emailed to account holders before they take effect. Carrying on using Trady after that is how you accept them.',
            },
            {
              p: 'Trady is operated by PT Efolusi Dunia Teknologi, at {address}. These terms are governed by the law of the Republic of Indonesia. Questions, complaints and anything else go to {email}.',
            },
          ],
        },
      },
    },
  },
}

const id: Dictionary = {
  htmlLang: 'id',
  skipToContent: 'Langsung ke konten',
  nav: {
    features: 'Fitur',
    how: 'Cara kerja',
    pricing: 'Harga',
    signIn: 'Masuk',
    signUp: 'Mulai gratis',
    signUpShort: 'Daftar',
    open: 'Buka Trady',
  },
  hero: {
    eyebrow: 'Transkripsi · Skor · Caption',
    headline: [
      { text: 'Ubah' },
      { text: 'rekaman' },
      { text: 'panjang' },
      { text: 'jadi' },
      { text: 'klip' },
      { text: 'pendek' },
      { text: 'ber-caption.', box: true },
    ],
    lede: 'Berikan satu podcast, wawancara, atau webinar, lalu terima klip vertikal dengan caption per kata, lengkap dengan skor dan timecode-nya.',
    ctaPrimary: 'Mulai gratis',
    ctaSecondary: 'Lihat cara kerjanya',
    chips: ['Caption per kata', 'Vertikal 9:16', 'Pilihan berskor', 'MP4 · SRT · VTT'],
    figureLabel: 'Contoh pilihan · episode ilustrasi',
    previousMoment: 'Momen sebelumnya',
    nextMoment: 'Momen berikutnya',
  },
  stack: {
    title: 'Klip sungguhan, bukan mockup.',
    lede: 'Semua klip di bawah ini keluar dari Trady, dalam bahasa yang diucapkan di videonya. Putar satu, lalu nilai sendiri caption dan framing-nya.',
  },
  find: {
    title: 'Setiap pilihan punya skor.',
    body: 'Trady membaca seluruh transkrip, memberi skor 0 sampai 99 pada setiap kandidat, dan menandai jenis momennya. Anda meninjau daftar pendeknya lengkap dengan timecode sebelum mengunggah apa pun.',
    figure: 'Contoh daftar pendek, lima skor tertinggi.',
  },
  captions: {
    title: 'Caption jatuh tepat di katanya.',
    body: 'Transkripsi menyimpan waktu setiap kata, jadi caption muncul persis saat kata itu diucapkan. Waktu yang sama diekspor sebagai SRT dan VTT.',
    figure:
      'Klip asli, dipotong dan diberi caption oleh Trady. Kata yang menyala adalah kata yang sedang diucapkan.',
  },
  reframe: {
    title: 'Masuk lebar, keluar vertikal.',
    body: 'Di paket Pro dan Business, potongan 9:16 mengikuti gerakan di dalam bingkai, jadi orang yang berbicara tetap terlihat, bukan tengah ruangan. Paket lain memotong dari tengah. Klip dipotong di awal dan akhir momennya, bukan di detik bulat.',
  },
  how: {
    eyebrow: 'Cara kerja',
    title: 'Tiga langkah dari unggah ke klip.',
    steps: [
      {
        time: 'Langkah 1',
        title: 'Tambahkan satu video panjang',
        body: 'Tempel URL video atau unggah file: podcast, wawancara, siaran langsung, atau webinar.',
      },
      {
        time: 'Langkah 2',
        title: 'Trady menemukan momennya',
        body: 'Trady mentranskrip dengan waktu per kata, memberi skor setiap kandidat momen, lalu merender yang layak disimpan.',
      },
      {
        time: 'Langkah 3',
        title: 'Tinjau, lalu unduh',
        body: 'Setiap klip menampilkan skor, kategori, dan timecode-nya. Unduh MP4 beserta berkas SRT dan VTT.',
      },
    ],
  },
  faq: {
    eyebrow: 'Pertanyaan',
    title: 'Yang paling sering ditanyakan.',
    items: [
      {
        question: 'Trady itu apa?',
        answer:
          'Trady menerima satu video panjang dan mengembalikan klip vertikal pendek dengan caption per kata. Trady membaca transkrip, memilih momen yang layak dipotong, dan merender setiap klip siap unggah.',
      },
      {
        question: 'Video seperti apa yang bisa diproses?',
        answer:
          'Podcast, wawancara, siaran langsung, webinar, atau ceramah, sebagai file yang Anda unggah atau URL video yang Anda tempel. Trady bekerja dari audio dan transkrip, jadi rekaman orang berbicara adalah kasus terbaiknya.',
      },
      {
        question: 'Apakah Trady mengerti bahasa Indonesia?',
        answer:
          'Ya. Transkripsi dan pemilihan momen berjalan pada audio berbahasa Indonesia, dan judul klip kembali dalam bahasa yang diucapkan di video tersebut.',
      },
      {
        question: 'Berapa lama prosesnya?',
        answer:
          'Tergantung panjang videonya. Transkripsi dan penilaian adalah bagian yang cepat; sebagian besar waktu tunggu dipakai untuk merender setiap klip dengan caption yang menyatu. Halaman proyek menampilkan setiap tahap saat berjalan.',
      },
      {
        question: 'Bagaimana harganya dihitung?',
        answer:
          'Per menit video sumber, bukan per klip. Satu episode berbiaya sama entah Trady menemukan tiga puluh momen atau empat, dan proses yang tidak menemukan apa pun tidak pernah ditagih. Menitnya berasal dari paket sekali bayar, bukan langganan.',
      },
      {
        question: 'Apa yang saya dapat?',
        answer:
          'Setiap klip diekspor sebagai MP4 vertikal 9:16 dengan caption yang sudah menyatu, ditambah berkas subtitle SRT dan VTT. Setiap klip membawa skor, kategori, serta timecode-nya.',
      },
    ],
  },
  close: {
    title: 'Coba dengan episode terakhir Anda.',
    body: 'Anda melihat setiap momen yang dipilih, lengkap dengan skor dan timecode-nya, sebelum mengunggah apa pun.',
    cta: 'Mulai gratis',
  },
  pricing: {
    title: 'Harga',
    lede: 'Semua paket melakukan hal yang sama: video panjang masuk, klip vertikal ber-caption keluar. Tagihannya per menit video sumber, dan proses yang tidak menemukan apa pun tidak pernah ditagih.',
    unavailable: 'Paket dan harga belum bisa dimuat saat ini. Silakan coba lagi beberapa menit lagi.',
    features: {
      url_ingest: 'Tempel URL video untuk mulai',
      manual_upload: 'Unggah file video langsung',
      captions: 'Caption per kata',
      face_tracking: 'Bingkai vertikal yang mengikuti pembicara',
      social_publishing: 'Terbitkan langsung ke kanal Anda (segera hadir)',
    },
    comingSoon: 'Segera hadir',
    creditsOnce: '{minutes} menit video sumber, sekali bayar',
    creditsOnSignup: '{minutes} menit video sumber saat mendaftar',
    billingNote:
      'Paket bukan langganan. Membeli paket adalah satu kali pembayaran yang menambahkan menitnya ke saldo Anda dan memindahkan workspace Anda ke paket itu. Paket tidak diperpanjang otomatis, dan Anda tidak ditagih lagi kecuali membeli lagi.',
    provisionalNote:
      'Harga paket berbayar adalah harga perkenalan dan dapat berubah. Checkout hanya ditawarkan saat Efolusi Pay aktif di lingkungan ini.',
    startFree: 'Mulai gratis',
    faqTitle: 'Pertanyaan',
    faq: [
      {
        question: 'Trady itu apa?',
        answer:
          'Trady menerima satu video panjang dan mengembalikan klip vertikal pendek dengan caption per kata. Ia membaca transkrip, memilih momen yang layak dipotong, lalu merender tiap klip siap unggah.',
      },
      {
        question: 'Bagaimana harganya dihitung?',
        answer:
          'Tagihannya per menit video sumber, bukan per klip. Menitnya berasal dari paket sekali bayar: bukan langganan dan tidak diperpanjang otomatis. Proses yang tidak menemukan momen layak potong tidak pernah ditagih, dan kalau prosesnya gagal di sisi kami, kreditnya kembali ke saldo Anda secara otomatis.',
      },
      {
        question: 'Apa yang bisa diunduh?',
        answer:
          'Tiap klip diekspor sebagai MP4 vertikal, lengkap dengan berkas caption SRT dan VTT supaya Anda bisa mengubah caption atau menerjemahkannya di tempat lain.',
      },
      {
        question: 'Klipnya rasio berapa?',
        answer:
          'Klip dirender vertikal 9:16, format yang diharapkan TikTok, Instagram Reels, dan YouTube Shorts.',
      },
      {
        question: 'Apakah video saya aman?',
        answer:
          'Tiap workspace dipisahkan dengan row-level security Postgres dan situs ini disajikan lewat HTTPS, dan video Anda tidak pernah dipakai melatih model apa pun milik kami. Untuk membuat transkrip, audio dan kata-kata di dalamnya dikirim ke OpenRouter; halaman privasi merinci persis apa yang keluar dari server.',
      },
    ],
  },
  footer: {
    tagline: 'Ubah rekaman panjang jadi klip pendek ber-caption. Dibuat oleh Efolusi.',
    product: 'Produk',
    legal: 'Legal',
    pricing: 'Harga',
    privacy: 'Privasi',
    terms: 'Ketentuan',
    rights: '© {year} PT Efolusi Dunia Teknologi. Hak cipta dilindungi.',
    madeIn: 'Dibuat di Indonesia',
  },
  languageName: 'Bahasa Indonesia',
  switchTo: 'Switch to English',
  signInScreen: {
    title: 'Masuk',
    redirecting: 'Mengantar Anda ke akun Efolusi…',
    unreachable: 'Layanan masuk tidak dapat dihubungi.',
    retry: 'Coba lagi',
    signedOut: 'Anda sudah keluar dari Trady.',
    signIn: 'Masuk lagi',
  },
  legal: {
    lastUpdated: 'Terakhir diperbarui',
    governingNote:
      'Halaman ini adalah terjemahan. Jika isinya berbeda dengan versi bahasa Inggris, versi bahasa Inggris yang berlaku.',
    privacyLinkLabel: 'halaman privasi',
    privacy: {
      metaTitle: 'Privasi',
      metaDescription:
        'Apa yang dikumpulkan Trady, di mana disimpan, siapa lagi yang melihatnya, dan berapa lama disimpan.',
      eyebrow: 'Legal',
      title: 'Privasi',
      lede: 'Apa yang kami kumpulkan, di mana disimpan, siapa lagi yang melihatnya, dan cara menghapusnya.',
      note: [
        'Trady masih baru, dan halaman ini menjelaskan apa yang dilakukan perangkat lunaknya hari ini, bukan apa yang kami rencanakan. Kalau sesuatu belum otomatis, itu dinyatakan apa adanya alih-alih dijanjikan jadwalnya.',
        'Halaman ini akan berubah seiring produknya berubah. Pertanyaan silakan kirim ke {email}.',
      ],
      sections: {
        'what-we-collect': {
          title: 'Apa yang kami kumpulkan',
          blocks: [
            {
              p: 'Hanya yang dibutuhkan produk ini untuk berjalan. Tidak ada layanan analitik, tidak ada kode iklan, dan tidak ada pelacak pihak ketiga di situs ini.',
            },
            { h3: 'Akun Anda' },
            {
              list: [
                'Alamat email, yang berasal dari akun Efolusi Anda dan merupakan satu-satunya cara kami menghubungi Anda.',
                'Tidak ada kata sandi. Anda masuk di my.efolusi.com, jadi kata sandi Trady tidak pernah diketik, dikirim, atau disimpan di sini: tidak ada kolom kata sandi di basis data kami yang bisa bocor.',
                'Sesi. Saat Anda masuk, peramban Anda menerima token acak di satu cookie. Server hanya menyimpan digest SHA-256 dari token itu, sehingga salinan basis data tidak membuat siapa pun bisa masuk sebagai Anda. Satu sesi berlaku {sessionDays} hari, dan keluar dari akun langsung mencabutnya.',
              ],
            },
            { h3: 'Apa yang Anda unggah dan apa yang kami buat darinya' },
            {
              list: [
                'Berkas video yang Anda kirim.',
                'Transkrip yang kami turunkan dari tiap video, termasuk waktu tiap kata, karena itulah bahan caption per kata.',
                'Momen yang kami pilih, lengkap dengan skor dan kategorinya, serta klip vertikal yang kami render dari momen itu.',
              ],
            },
            { h3: 'Menjalankan akun' },
            {
              list: [
                'Buku besar kredit. Setiap penagihan, pengembalian, dan penambahan adalah satu entri bertanda waktu, sehingga saldo Anda selalu bisa dijelaskan baris per baris.',
                'Catatan audit atas tindakan istimewa, seperti membuat atau menghapus proyek: siapa yang melakukannya, kapan, dan apa yang berubah.',
                'Log server biasa, yang memuat alamat IP dan jalur permintaan, disimpan untuk penelusuran masalah dan penanganan penyalahgunaan.',
              ],
            },
          ],
        },
        'where-it-goes': {
          title: 'Di mana datanya disimpan',
          blocks: [
            {
              p: 'Trady berjalan di satu server. Data akun, proyek, transkrip, metadata klip, dan buku besar kredit berada dalam satu basis data PostgreSQL. Berkas video dan klip hasil render berada di object storage MinIO pada mesin yang sama.',
            },
            {
              p: 'Setiap tabel yang memuat data workspace membawa id workspace dan dilindungi row level security Postgres, sehingga kueri yang dijalankan atas nama satu workspace tidak dapat membaca baris milik workspace lain sekalipun kode aplikasinya memintanya. Lalu lintas ke situs ini disajikan lewat HTTPS.',
            },
          ],
        },
        'who-else-sees-it': {
          title: 'Siapa lagi yang melihatnya',
          blocks: [
            {
              p: 'Beberapa perusahaan di luar server kami mengerjakan sebagian prosesnya. Berikut daftar lengkap apa yang keluar dari mesin ini dan siapa yang menerimanya.',
            },
            { h3: 'Transkrip dan pemilihan klip' },
            {
              p: '{openRouterLead} Kami mengirim audio video Anda ke model speech to text untuk menghasilkan transkrip, lalu kami kirim teks transkrip itu ke sebuah language model untuk memilih momen yang layak dipotong. Kedua permintaan itu lewat Relay, gateway AI yang dijalankan Efolusi, lalu diteruskan ke OpenRouter. Artinya audio Anda dan kata-kata yang diucapkan di video Anda keluar dari server kami dan diproses oleh OpenRouter serta oleh penyedia model di balik model yang sedang dipakai.',
            },
            {
              p: 'Kami tidak mengendalikan cara OpenRouter atau penyedia di hulunya memperlakukan apa yang mereka terima. Ketentuan dan kebijakan privasi mereka sendiri yang mengaturnya, dan kalau isi sebuah video membuat hal ini jadi masalah, jangan diunggah.',
            },
            { h3: 'Cloudflare' },
            {
              p: 'Situs ini disajikan lewat Cloudflare, yang menjadi jaringan pengiriman konten kami dan melindungi situs dari serangan. Cloudflare melihat alamat IP Anda dan permintaan yang dikirim browser Anda ke situs ini. Cloudflare juga memberi tahu server kami dari negara mana sebuah permintaan datang, dan kami memakainya hanya untuk memilih antara halaman berbahasa Inggris dan Indonesia.',
            },
            { h3: 'Video yang Anda tambahkan lewat tautan' },
            {
              p: 'Saat Anda menambahkan video dengan menempel tautan alih-alih mengunggah berkas, server kami mengunduhnya dari situs yang Anda tautkan, misalnya YouTube, Vimeo, Google Drive, atau Dropbox, memakai alat open source yt-dlp. Situs itu menerima permintaan dari server kami untuk video tersebut, dan ketentuan serta kebijakan privasinya sendiri yang berlaku. Tautkan hanya video yang memang berhak Anda pakai.',
            },
            { h3: 'Laporan galat' },
            {
              p: 'Saat API atau worker pemrosesan kami mengalami galat, sebuah laporan dikirim ke Sentry agar kami bisa memperbaikinya. Laporan itu berisi galatnya, bagian layanan tempat galat terjadi, id permintaan atau id job, dan id workspace Anda. Laporan itu diatur agar tidak menyertakan cookie, token masuk, atau alamat IP.',
            },
            { h3: 'Koneksi kanal' },
            {
              p: 'Menghubungkan kanal YouTube atau Facebook saat ini dimatikan di Trady, jadi tidak ada data kanal Anda yang dikirim ke mana pun. Kode untuk fitur itu memakai Composio, layanan yang menangani proses masuk ke platform tersebut. Sebelum fitur itu dinyalakan, halaman ini akan menjelaskan apa yang diterima Composio dan ketentuan YouTube serta Google mana yang berlaku.',
            },
            {
              p: 'Selain itu: tidak ada. Kami tidak menjual data Anda, tidak membagikannya ke pengiklan, dan tidak memakai video, transkrip, atau klip Anda untuk melatih model apa pun milik kami.',
            },
          ],
        },
        retention: {
          title: 'Berapa lama kami menyimpannya',
          blocks: [
            {
              p: 'Jawaban jujurnya: penghapusan hari ini masih manual, dan kami lebih memilih mengatakannya daripada menerbitkan jadwal retensi yang tidak ditegakkan kode apa pun.',
            },
            {
              list: [
                'Menghapus proyek menandainya sebagai terhapus dan mengeluarkannya dari workspace Anda. Video sumber dan klip hasil render tetap ada di object storage sampai seseorang menghapusnya secara manual. Belum ada pembersihan otomatis.',
                'Sesi yang kedaluwarsa dan yang dicabut tetap tersimpan sebagai baris sampai dibersihkan secara manual. Sesi itu tidak bisa dipakai untuk masuk begitu kedaluwarsa atau dicabut.',
                'Entri buku besar kredit dan catatan audit disimpan selama akunnya ada, karena keduanya adalah rekaman atas apa yang ditagihkan kepada Anda dan apa yang terjadi.',
                'Kalau Anda ingin video, klip, dan akun Anda dihapus, kirim surel ke {email} dan kami akan melakukannya secara manual serta mengonfirmasi setelah selesai.',
              ],
            },
          ],
        },
        cookies: {
          title: 'Cookie',
          blocks: [
            {
              p: 'Satu cookie, dipasang saat Anda masuk, berisi token sesi yang dijelaskan di atas. Cookie itu ditandai http only sehingga skrip halaman tidak bisa membacanya. Tidak ada cookie analitik atau iklan, dan itulah sebabnya situs ini tidak punya banner cookie.',
            },
          ],
        },
        payments: {
          title: 'Pembayaran',
          blocks: [
            {
              p: 'Saat checkout berbayar diaktifkan, Trady mengirim paket yang dihargai server dan referensi invoice ke Efolusi Pay. Pay menangani detail pembayaran serta penyedia dasarnya di sistemnya sendiri; Trady hanya menerima bukti settlement yang diperlukan untuk mengkredit tenant yang benar.',
            },
          ],
        },
        'your-choices': {
          title: 'Pilihan Anda',
          blocks: [
            {
              p: 'Anda bisa menghapus proyek dari dasbor kapan saja. Untuk salinan data Anda, atau untuk penghapusan akun beserta seluruh isinya, kirim surel ke {email}. Kami akan menjawab sebagai manusia, bukan sistem tiket.',
            },
            {
              p: 'Trady tidak dibuat untuk anak-anak dan kami tidak dengan sengaja mengumpulkan apa pun dari mereka.',
            },
          ],
        },
        changes: {
          title: 'Perubahan pada halaman ini',
          blocks: [
            {
              p: 'Ketika perilaku perangkat lunaknya berubah, halaman ini ikut berubah, dan tanggal di bagian atas bergeser. Kalau perubahannya signifikan, misalnya ada perusahaan baru yang memproses konten Anda, kami akan mengirim surel ke pemilik akun alih-alih diam-diam menyunting teksnya.',
            },
            { p: 'Trady dioperasikan oleh PT Efolusi Dunia Teknologi, di {address}.' },
          ],
        },
      },
    },
    terms: {
      metaTitle: 'Ketentuan',
      metaDescription:
        'Aturan memakai Trady: apa yang boleh diunggah, bagaimana kredit ditagihkan, dan bagaimana masing-masing pihak mengakhirinya.',
      eyebrow: 'Legal',
      title: 'Ketentuan',
      lede: 'Versi singkatnya: bawa video yang memang berhak Anda pakai, kami menagih kredit untuk menit yang kami proses, dan siapa pun di antara kita boleh berhenti.',
      note: [
        'Trady adalah produk yang masih muda. Ketentuan ini menjelaskan cara kerjanya hari ini, dan akan berubah seiring produknya tumbuh. Kalau berubah, tanggal di bagian atas bergeser dan pemilik akun menerima surel sebelum hal yang material mulai berlaku.',
        'Kalau ada baris di sini yang tidak jelas, tanyakan alih-alih menebak: {email}.',
      ],
      sections: {
        'what-this-covers': {
          title: 'Apa yang dicakup',
          blocks: [
            {
              p: 'Ketentuan ini berlaku untuk Trady, layanan di trady.efolusi.com yang menerima satu video panjang dan mengembalikan klip vertikal dengan caption per kata. Memakai layanan ini berarti Anda menerimanya. Kalau Anda memakai Trady untuk sebuah perusahaan, Anda menyatakan bahwa Anda boleh menerimanya atas nama perusahaan itu.',
            },
          ],
        },
        'your-account': {
          title: 'Akun Anda',
          blocks: [
            {
              p: 'Anda perlu akun Efolusi untuk memakai Trady: proses masuk terjadi di my.efolusi.com, bukan di sini. Jaga agar alamat email tetap akurat, karena itu satu-satunya cara kami menghubungi Anda, dan simpan kredensial Efolusi Anda untuk diri sendiri. Apa pun yang dilakukan lewat akun Anda dianggap dilakukan oleh Anda, jadi beri tahu kami segera kalau Anda merasa orang lain berhasil masuk.',
            },
            {
              p: 'Pekerjaan berada di dalam sebuah workspace. Siapa pun yang Anda tambahkan ke satu workspace bisa melihat dan menindaklanjuti proyek di dalamnya.',
            },
          ],
        },
        'acceptable-use': {
          title: 'Apa yang boleh Anda unggah',
          blocks: [
            {
              p: 'Ini bagian yang paling penting. Anda harus punya hak atas video yang Anda unggah, dan hak untuk membuat klip darinya.',
            },
            {
              list: [
                'Video itu milik Anda, atau Anda punya izin dari pemiliknya, termasuk izin atas musik, cuplikan, dan suara di dalamnya.',
                'Orang-orang yang terekam di dalamnya setuju untuk direkam, bila persetujuan mereka memang diperlukan.',
                'Isinya sah menurut hukum. Tidak ada konten seksual yang melibatkan anak di bawah umur, tidak ada materi yang dibuat untuk melecehkan atau mengancam seseorang, dan tidak ada yang melanggar hukum di tempat Anda berada.',
                'Anda tidak akan memakai Trady untuk menyamar sebagai orang lain, untuk menyusun suntingan yang menyesatkan atas ucapan orang lain, atau untuk menerbitkan sesuatu yang berpura-pura sebagai pernyataan yang pernah mereka buat.',
              ],
            },
            {
              p: 'Anda juga setuju untuk tidak menyerang layanannya sendiri: tidak ada upaya menjangkau data workspace lain, tidak ada scraping situs ini dengan klien otomatis, dan tidak ada penyelidikan celah tanpa bertanya lebih dulu kepada kami. Kalau Anda menemukan masalah keamanan, beri tahu kami di {email} dan kami akan berterima kasih untuk itu.',
            },
          ],
        },
        'your-content': {
          title: 'Siapa memiliki apa',
          blocks: [
            {
              p: 'Video Anda milik Anda. Transkrip dan klip yang dibuat darinya juga milik Anda. Kami hanya mengambil izin yang kami butuhkan untuk menjalankan layanan ini: menyimpan video Anda, mengirim audio dan transkripnya ke pemroses yang disebut di {privacyLink}, serta membuat dan menyerahkan kembali klipnya.',
            },
            {
              p: 'Kami tidak memakai konten Anda untuk mempromosikan Trady, dan tidak memakainya untuk melatih model kami sendiri.',
            },
            {
              p: 'Contoh klip di halaman depan dipotong oleh Trady dari episode podcast buatan pihak lain. Klip itu ditampilkan hanya sebagai contoh hasil produk ini, dan hak atas rekaman tersebut tetap milik pemiliknya. Kalau Anda pemilik salah satunya dan ingin klip itu diturunkan, kirim surel ke {email} dan kami akan menghapusnya.',
            },
            { p: 'Trady itu sendiri, perangkat lunak dan situsnya, tetap milik kami.' },
          ],
        },
        credits: {
          title: 'Kredit dan penagihan',
          blocks: [
            {
              p: 'Trady ditagih berdasarkan panjang video yang Anda masukkan, bukan berdasarkan jumlah klip yang ditemukan. Kredit dihitung dalam detik bulat media sumber, jadi video enam puluh menit berbiaya enam puluh menit kredit entah menghasilkan lima klip atau tiga puluh.',
            },
            {
              list: [
                'Penagihan diambil sekali, saat proyek mulai diproses, dan diambil sekali per proyek. Mengulang proyek yang sudah ditagih tidak menagih lagi.',
                'Kalau prosesnya gagal di sisi kami, kreditnya kembali ke saldo Anda secara otomatis.',
                'Kalau saldo Anda kurang, proyeknya tidak dimulai dan kami memberi tahu berapa kekurangannya. Tidak ada yang berjalan di atas saldo negatif.',
                'Setiap penagihan dan setiap pengembalian adalah satu baris di buku besar yang bisa Anda baca di halaman penggunaan, sehingga saldo Anda selalu bisa dijelaskan.',
              ],
            },
            { h3: 'Membeli kredit' },
            {
              p: 'Paket dibeli sekali bayar. Menitnya ditambahkan ke saldo Anda satu kali dan workspace Anda pindah ke paket itu. Ini bukan langganan, tidak diperpanjang otomatis, dan tidak ada penagihan lagi kecuali Anda membeli lagi.',
            },
            {
              p: 'Checkout berbayar hanya ditawarkan saat Efolusi Pay diaktifkan. Trady mengirim paket yang dihargai server dan referensi invoice tetap (bukan harga dari browser), lalu menerapkan settlement terverifikasi satu kali. Jika checkout tidak tersedia, tidak ada penagihan yang dicoba. Jika saldo keliru, hubungi kami agar buku besarnya dapat diperiksa.',
            },
          ],
        },
        availability: {
          title: 'Ketersediaan',
          blocks: [
            {
              p: 'Kami tidak menjanjikan uptime. Trady berjalan di satu server, usianya masih dini, dan kami akan menurunkannya untuk deploy, untuk migrasi basis data, atau untuk memperbaiki yang rusak. Lama pemrosesan bergantung pada panjang video Anda dan pada layanan di luar kendali kami.',
            },
            {
              p: 'Simpan salinan sendiri untuk video apa pun yang Anda pedulikan. Trady bukan layanan cadangan, dan Anda sebaiknya tidak memperlakukannya sebagai satu-satunya tempat sebuah berkas berada.',
            },
            {
              p: 'Layanan ini disediakan apa adanya, tanpa jaminan. Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kehilangan pendapatan, kehilangan pekerjaan, atau kehilangan data, dan total tanggung jawab kami atas klaim apa pun dibatasi sebesar yang Anda bayarkan kepada kami untuk layanan ini dalam tiga bulan sebelum klaim itu muncul.',
            },
          ],
        },
        'ending-it': {
          title: 'Mengakhirinya',
          blocks: [
            {
              p: 'Anda bisa berhenti memakai Trady kapan pun Anda mau. Minta kami menutup akun Anda dan kami akan melakukannya, sekaligus menghapus video dan klip di dalamnya, secara manual, dan kami akan mengonfirmasi setelah selesai.',
            },
            {
              p: 'Kami bisa menangguhkan atau menutup akun yang melanggar aturan di atas, yang tidak membayar menit yang diprosesnya, atau yang menempatkan layanan ini dalam risiko bagi semua orang. Kecuali ada hal yang mendesak atau melanggar hukum, kami akan memberi tahu apa yang terjadi dan memberi Anda kesempatan menanggapi lebih dulu. Kredit yang belum terpakai pada akun yang kami tutup karena aturan yang baru kami buat belakangan akan dikembalikan; kredit yang belum terpakai pada akun yang ditutup karena penyalahgunaan tidak dikembalikan.',
            },
          ],
        },
        changes: {
          title: 'Perubahan dan kontak',
          blocks: [
            {
              p: 'Kami akan mengubah ketentuan ini seiring produknya berubah. Tanggal di bagian atas selalu menyatakan kapan terakhir berubah, dan perubahan yang material dikirimkan lewat surel ke pemilik akun sebelum mulai berlaku. Meneruskan pemakaian Trady setelah itu adalah cara Anda menerimanya.',
            },
            {
              p: 'Trady dioperasikan oleh PT Efolusi Dunia Teknologi, di {address}. Ketentuan ini tunduk pada hukum Republik Indonesia. Pertanyaan, keluhan, dan hal lainnya silakan kirim ke {email}.',
            },
          ],
        },
      },
    },
  },
}

export const dictionaries: Record<Locale, Dictionary> = { en, id }
