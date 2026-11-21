# Trady site

The website of Trady: the landing page, pricing, privacy and terms, in English and Indonesian.
It is a Next.js site built with OpenNext and served by the Cloudflare Worker `trady` (`wrangler.jsonc`).

The app (projects, editor, clips, usage, sign-in) lives on its own host (`NEXT_PUBLIC_APP_URL`, default
`https://app.trady.efolusi.com`). Old links to app routes on this site get a 308 to the same path there.
Pricing reads the plan catalogue from the Trady API (`NEXT_PUBLIC_API_ORIGIN`) and says so when it cannot.

- `src/app/`: the pages.
- `src/lib/contracts/`: the API contract types and schemas, copied from the Trady contracts package.
- `public/brand/`: the clip videos the landing page plays.

## Develop

Node 26.13.1 and pnpm 11.24.0 (`npm install -g pnpm@11.24.0`).

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test
pnpm preview    # builds with OpenNext and serves it with wrangler, the way Cloudflare runs it
```

## Deploy

`.github/workflows/deploy.yml` deploys from a `v*` tag on `main`, with the `CLOUDFLARE_API_TOKEN` secret and the
`CLOUDFLARE_ACCOUNT_ID` variable of the `production` environment. Every change reaches `main` through a pull request.

## License

Efolusi Reference License, see [LICENSE](LICENSE). You may read this site and run it locally as a sample of Meridian. You may not copy it into another product. The product name and logo are not part of that grant. Meridian itself remains Apache-2.0.
