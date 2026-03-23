# Frontend Deployment Guide — UCSD AgentBuilder

## Quick Reference

| Item | Value |
|------|-------|
| **Framework** | React 19 + TypeScript + Vite 7 |
| **Hosting** | GitHub Pages |
| **Base URL** | `/AgentBuilder/` |
| **Build command** | `npm run build` (`tsc -b && vite build`) |
| **Output directory** | `dist/` |
| **Node version** | 22 (specified in CI) |
| **Router** | HashRouter (required for GitHub Pages) |
| **CI/CD** | `.github/workflows/deploy.yml` |

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development](#2-local-development)
3. [Building for Production](#3-building-for-production)
4. [GitHub Pages Deployment (Automated)](#4-github-pages-deployment-automated)
5. [GitHub Pages Deployment (Manual)](#5-github-pages-deployment-manual)
6. [Deploying to Other Platforms](#6-deploying-to-other-platforms)
7. [Environment & Configuration](#7-environment--configuration)
8. [Troubleshooting](#8-troubleshooting)
9. [Rebuilding from Scratch](#9-rebuilding-from-scratch)

---

## 1. Prerequisites

- **Node.js 22+** (matches CI environment)
- **npm** (ships with Node)
- **Git** for version control

Verify your setup:

```bash
node --version   # v22.x.x
npm --version    # 10.x.x or later
git --version
```

---

## 2. Local Development

```bash
# Clone the repository
git clone https://github.com/fogbellco/agentbuilder.git
cd agentbuilder

# Install dependencies
npm install

# Start the Vite dev server (port 5173 by default)
npm run dev
```

The dev server runs at `http://localhost:5173/AgentBuilder/` and supports HMR (hot module replacement).

### With Backend (Optional)

The frontend works standalone (Zustand persists to localStorage). To run with the backend API:

```bash
# In a separate terminal
cd server
cp .env.example .env
# Edit .env with your OPENAI_API_KEY and JWT_SECRET
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3001` automatically (configured in `vite.config.ts`).

---

## 3. Building for Production

```bash
npm run build
```

This runs two steps:
1. **`tsc -b`** — TypeScript type checking (strict mode, no unused vars/params)
2. **`vite build`** — Bundles and minifies into `dist/`

Output structure:

```
dist/
├── index.html              # Entry HTML
├── assets/
│   ├── index-*.css         # Compiled Tailwind CSS (~67 KB)
│   └── index-*.js          # Bundled JS (~2 MB, ~580 KB gzipped)
```

### Preview the Build Locally

```bash
npm run preview
# Opens at http://localhost:4173/AgentBuilder/
```

### Lint Check

```bash
npm run lint
```

---

## 4. GitHub Pages Deployment (Automated)

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that handles deployment automatically.

### How It Works

1. **Triggers**: Pushes to `main`, `master`, or `claude/**` branches
2. **Build job**: Runs on every push to those branches (installs deps, runs `npm run build`)
3. **Deploy job**: Only runs when pushing to `main` or `master` — deploys `dist/` to GitHub Pages

### Setup Requirements

1. **Enable GitHub Pages** in repository settings:
   - Go to **Settings > Pages**
   - Under **Source**, select **GitHub Actions**
   - (Do NOT select "Deploy from a branch" — the workflow handles it)

2. **Repository permissions** (set in the workflow):
   ```yaml
   permissions:
     contents: read
     pages: write
     id-token: write
   ```

3. **Push to main/master** to trigger deployment:
   ```bash
   git push origin main
   ```

4. The site will be available at:
   ```
   https://<org-or-user>.github.io/AgentBuilder/
   ```

### Monitoring Deployments

- Check the **Actions** tab in GitHub to see build/deploy status
- Failed builds are usually TypeScript errors (`noUnusedLocals`, `noUnusedParameters` are enforced)

---

## 5. GitHub Pages Deployment (Manual)

If you need to deploy without CI:

```bash
# Build locally
npm run build

# The dist/ folder contains the complete static site.
# You can manually upload it to GitHub Pages or any static host.
```

For a manual GitHub Pages deploy using `gh-pages` (not currently configured but possible):

```bash
npm install -D gh-pages
npx gh-pages -d dist
```

---

## 6. Deploying to Other Platforms

The `dist/` output is a standard static site. It can be deployed anywhere that serves static files.

### Netlify

```bash
npm run build
# Deploy dist/ via Netlify CLI or drag-and-drop
# No redirect rules needed — HashRouter handles all routing client-side
```

Or add a `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Important**: If switching from GitHub Pages, update `base` in `vite.config.ts` from `'/AgentBuilder/'` to `'/'`.

### Vercel

```bash
# vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Important**: Update `base` in `vite.config.ts` to `'/'` if not using a subpath.

### Docker / Nginx

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

No special Nginx config needed for HashRouter since all routes use `#` fragments.

### AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
# Invalidate CloudFront cache if applicable
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## 7. Environment & Configuration

### Base Path

The base path is set in `vite.config.ts`:

```ts
export default defineConfig({
  base: '/AgentBuilder/',  // Change this for different hosting paths
  // ...
})
```

- **GitHub Pages**: Keep as `'/AgentBuilder/'`
- **Root domain hosting**: Change to `'/'`
- **Custom subpath**: Set to `'/your-path/'`

### Routing

The app uses **HashRouter** (`react-router-dom`), meaning all routes use `#` fragments:

```
https://example.com/AgentBuilder/#/describe
https://example.com/AgentBuilder/#/pipeline
https://example.com/AgentBuilder/#/stage/gather
```

This is intentional — GitHub Pages doesn't support server-side SPA fallback routing. HashRouter works on any static host without configuration.

### API Proxy (Development Only)

In development, `/api` requests proxy to `http://localhost:3001`. In production, the backend must be hosted separately and the frontend needs to be configured to point to it (or the backend features are optional).

### State Persistence

User session data is stored in **localStorage** under the key `ucsd-agentbuilder-session` via Zustand's `persist` middleware. No server-side state is required for the core wizard flow.

---

## 8. Troubleshooting

### Build Fails with TypeScript Errors

The project enforces strict TypeScript:
- `noUnusedLocals: true` — Remove or prefix unused variables with `_`
- `noUnusedParameters: true` — Remove or prefix unused params with `_`
- `strict: true` — No implicit `any`, strict null checks, etc.

Fix all TypeScript errors before building. Run `npx tsc -b --noEmit` to check without building.

### Build Fails with "Cannot find type definition"

```
error TS2688: Cannot find type definition file for 'vite/client'
```

Run `npm install` — dependencies are missing.

### Large Bundle Warning

```
Some chunks are larger than 500 kB after minification
```

This is a warning, not an error. The single-chunk JS bundle is ~2 MB (580 KB gzipped). To reduce:
- Add code splitting with `React.lazy()` and dynamic `import()`
- Configure `build.rollupOptions.output.manualChunks` in `vite.config.ts`

### Blank Page on GitHub Pages

1. Verify `base` in `vite.config.ts` matches your repository name: `'/AgentBuilder/'`
2. Verify GitHub Pages source is set to "GitHub Actions" (not "Deploy from a branch")
3. Verify the deploy workflow ran successfully in the Actions tab
4. Check browser console for 404 errors on assets

### Routes Return 404

If using BrowserRouter instead of HashRouter, GitHub Pages will return 404 for any non-root URL. The app intentionally uses HashRouter to avoid this. Do not switch to BrowserRouter unless you add a `404.html` redirect hack or move to a host that supports SPA fallback.

---

## 9. Rebuilding from Scratch

If you need to rebuild the frontend from a clean state:

```bash
# 1. Remove existing build artifacts and dependencies
rm -rf dist node_modules

# 2. Clear npm cache (optional, for stubborn issues)
npm cache clean --force

# 3. Reinstall dependencies
npm install

# 4. Verify TypeScript compiles
npx tsc -b

# 5. Run the full build
npm run build

# 6. Preview locally to verify
npm run preview
# Visit http://localhost:4173/AgentBuilder/

# 7. If satisfied, commit and push to trigger deployment
git add -A
git commit -m "Rebuild frontend"
git push origin main
```

### Full Environment Reset

If the project is in a broken state and you need a completely fresh start:

```bash
# 1. Save any local changes
git stash

# 2. Clean everything
rm -rf node_modules dist .tsbuildinfo
rm -f node_modules/.tmp/tsconfig.app.tsbuildinfo
rm -f node_modules/.tmp/tsconfig.node.tsbuildinfo

# 3. Reset to latest remote
git fetch origin main
git reset --hard origin/main

# 4. Fresh install and build
npm install
npm run build

# 5. Restore local changes if needed
git stash pop
```

### Verifying the Deployment Pipeline End-to-End

```bash
# 1. Install and build locally
npm install
npm run build

# 2. Preview and manually test all routes:
npm run preview
#    - http://localhost:4173/AgentBuilder/          (Landing)
#    - http://localhost:4173/AgentBuilder/#/describe (Describe form)
#    - http://localhost:4173/AgentBuilder/#/pipeline (Pipeline view)
#    - http://localhost:4173/AgentBuilder/#/stage/gather  (Gather wizard)
#    - http://localhost:4173/AgentBuilder/#/summary  (Summary page)

# 3. Push to main to trigger automated deployment
git push origin main

# 4. Check GitHub Actions for build + deploy status
# 5. Verify live site at https://<org>.github.io/AgentBuilder/
```
