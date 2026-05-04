# Visionista Platform Deployment Guide

## 🚀 Overview

This guide provides comprehensive instructions for deploying the Visionista platform to production environments, including setup, configuration, monitoring, and maintenance procedures.

---

## 📋 Prerequisites

### System Requirements

- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher (or yarn 3.0+)
- **Git**: Latest version
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Development Tools

- **Code Editor**: VS Code with TypeScript and Tailwind CSS extensions
- **Version Control**: Git with GitHub/GitLab access
- **Package Manager**: npm or Yarn
- **Build Tools**: Vite (included in project)

---

## 🏗️ Build Process

### Local Development Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Development server will be available at http://localhost:5173
```

### Production Build

```bash
# Install production dependencies
npm ci --production=false

# Run type checking
npm run type-check

# Build for production
npm run build

# Preview production build (optional)
npm run preview
```

### Build Optimization

The production build includes:

- **TypeScript compilation** with strict type checking
- **Code minification** for reduced bundle size
- **Asset optimization** including image compression
- **CSS purging** to remove unused Tailwind classes
- **Tree shaking** to eliminate dead code
- **Source maps** for debugging (configurable)

---

## 🌐 Deployment Platforms

### 1. Vercel (Recommended)

#### Automatic Deployment

1. **Connect Repository**

   ```bash
   # Connect your GitHub/GitLab repository to Vercel
   # Vercel will automatically detect the React app
   ```

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

3. **Environment Variables** (if needed)
   ```bash
   VITE_API_URL=https://api.visionista.com
   VITE_APP_ENV=production
   ```

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Netlify

#### Automatic Deployment

1. **Site Configuration** (netlify.toml)

   ```toml
   [build]
     publish = "dist"
     command = "npm run build"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. **Deploy via Git**
   - Connect repository to Netlify
   - Configure build settings
   - Deploy automatically on git push

#### Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### 3. AWS S3 + CloudFront

#### S3 Static Website Setup

```bash
# Create S3 bucket
aws s3 mb s3://visionista-frontend

# Configure bucket for static website hosting
aws s3 website s3://visionista-frontend \
  --index-document index.html \
  --error-document index.html

# Upload build files
aws s3 sync dist/ s3://visionista-frontend --delete

# Set public read permissions
aws s3api put-bucket-policy \
  --bucket visionista-frontend \
  --policy file://bucket-policy.json
```

#### CloudFront Distribution

```json
{
  "CallerReference": "visionista-cf-distribution",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-visionista-frontend",
        "DomainName": "visionista-frontend.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200"
      }
    ]
  }
}
```

### 4. GitHub Pages

#### Workflow Setup (.github/workflows/deploy.yml)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

## ⚙️ Environment Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_URL=https://api.visionista.com
VITE_API_VERSION=v1

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=false

# Third-party Services
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Monitoring
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GTM_ID=your_google_tag_manager_id
```

### Production Configuration

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  plugins: [react()],
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
```

---

## 🔒 Security Configuration

### Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.visionista.com;
">
```

### Security Headers

```javascript
// Express.js middleware example for API
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### HTTPS Configuration

```bash
# Ensure HTTPS redirect in production
# Vercel and Netlify handle this automatically
# For custom servers, configure HTTPS redirect
```

---

## 📊 Monitoring & Analytics

### Performance Monitoring

```typescript
// Web Vitals tracking
import {
  getCLS,
  getFID,
  getFCP,
  getLCP,
  getTTFB,
} from "web-vitals";

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  if (window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(
        metric.name === "CLS"
          ? metric.value * 1000
          : metric.value,
      ),
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Error Tracking (Sentry Integration)

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  tracesSampleRate: 0.1,
});

// Error boundary component
const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: ({ error, resetError }) => (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <button onClick={resetError}>Try again</button>
    </div>
  ),
});
```

### Google Analytics 4

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🚨 Health Checks & Monitoring

### Health Check Endpoint

```typescript
// Simple health check for static site
// Create a health.json file in public directory
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Uptime Monitoring

```bash
# Use services like:
# - Pingdom
# - UptimeRobot
# - StatusCake
# - DataDog

# Monitor these endpoints:
# - Main application: https://visionista.com
# - Health check: https://visionista.com/health.json
# - API endpoints: https://api.visionista.com/health
```

### Performance Budgets

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "2kb",
      "maximumError": "4kb"
    }
  ]
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: echo "Deploy to staging environment"

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: echo "Deploy to production environment"
```

### Quality Gates

```yaml
quality-gate:
  runs-on: ubuntu-latest
  steps:
    - name: Code Quality Check
      run: |
        npm run lint
        npm run type-check
        npm run test:coverage

    - name: Security Audit
      run: npm audit --audit-level moderate

    - name: Bundle Size Check
      run: npm run build && npm run bundle-analyzer
```

---

## 📱 Mobile Deployment (PWA)

### Service Worker Setup

```typescript
// public/sw.js - Basic service worker
const CACHE_NAME = "visionista-v1";
const urlsToCache = [
  "/",
  "/static/css/main.css",
  "/static/js/main.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
```

### PWA Manifest

```json
{
  "name": "Visionista Platform",
  "short_name": "Visionista",
  "description": "Empowering women entrepreneurs",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7C3AED",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🛠️ Maintenance & Updates

### Regular Maintenance Tasks

```bash
# Weekly tasks
npm audit && npm audit fix
npm outdated
npm update

# Monthly tasks
npm run bundle-analyzer
npm run lighthouse
npm run accessibility-audit

# Quarterly tasks
npm run security-scan
npm run performance-review
```

### Dependency Management

```json
{
  "scripts": {
    "deps:check": "npm outdated",
    "deps:update": "npm update",
    "deps:audit": "npm audit",
    "deps:fix": "npm audit fix"
  }
}
```

### Backup Strategy

```bash
# Code repository backup (Git)
git remote add backup https://backup-repo-url
git push backup main

# Configuration backup
# Store environment variables securely
# Document deployment procedures
# Maintain infrastructure as code
```

---

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .vite
npm run build
```

#### Deployment Issues

```bash
# Check environment variables
echo $VITE_API_URL

# Verify build output
ls -la dist/

# Test production build locally
npm run preview
```

#### Performance Issues

```bash
# Analyze bundle size
npm run build
npm run bundle-analyzer

# Check for memory leaks
npm run build -- --profile
```

### Rollback Procedures

```bash
# Vercel rollback
vercel rollback

# Netlify rollback via dashboard
# AWS CloudFront cache invalidation
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

---

## 📞 Support & Contact

### Emergency Contacts

- **Technical Lead**: [tech-lead@visionista.com]
- **DevOps Team**: [devops@visionista.com]
- **Security Team**: [security@visionista.com]

### Documentation Resources

- **Internal Wiki**: [Link to internal documentation]
- **API Documentation**: [Link to API docs]
- **Architecture Diagrams**: [Link to system diagrams]

### Escalation Procedures

1. **Level 1**: Development team member
2. **Level 2**: Technical lead
3. **Level 3**: Engineering manager
4. **Level 4**: CTO/VP Engineering

---

This deployment guide ensures a professional, scalable, and maintainable deployment process for the Visionista platform across multiple environments and platforms.