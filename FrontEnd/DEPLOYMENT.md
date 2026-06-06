# Vercel Deployment Guide

This guide explains how to deploy Decipher to Vercel.

## Prerequisites

- Vercel account ([sign up here](https://vercel.com))
- Git repository connected to Vercel
- Environment variables ready to configure

## Step 1: Connect Your Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Vercel will auto-detect the TanStack Start framework

## Step 2: Configure Environment Variables

In your Vercel project settings, go to **Settings → Environment Variables** and add:

### Required Variables:

```
SUPABASE_PUBLISHABLE_KEY=<your_key>
SUPABASE_URL=<your_url>
VITE_SUPABASE_PROJECT_ID=<your_project_id>
VITE_SUPABASE_PUBLISHABLE_KEY=<your_key>
VITE_SUPABASE_URL=<your_url>
DIFY_ANALYST_API_KEY=<your_key>
DIFY_SCIENTIST_API_KEY=<your_key>
DIFY_ENGINEER_API_KEY=<your_key>
NEXT_PUBLIC_DIFY_API_URL=<your_dify_url>
DIFY_API_URL=<your_dify_url>
GROQ_API_KEY=<your_groq_api_key>
NODE_ENV=production
```

### For Local Testing:
Create a `.env.local` file (already in `.gitignore`):
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

## Step 3: Deploy

### Automatic Deployment (Recommended)
- Push to your main branch (typically `main` or `master`)
- Vercel automatically triggers a build and deploy

### Manual Deployment
```bash
npm install -g vercel
vercel login
vercel
```

## Step 4: Build Configuration

The `vercel.json` file specifies:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Max Function Duration**: 60 seconds (for API routes)
- **Memory**: 1024MB
- **Region**: US (iad1)

These are automatically used by Vercel.

## Step 5: Verify Deployment

1. Check build logs in Vercel Dashboard → Deployments
2. Visit your deployment URL
3. Test authentication and API calls
4. Monitor function logs if issues arise

## Troubleshooting

### Build Fails
- Check Node version (Vercel uses Node 20 by default)
- Verify all environment variables are set
- Check `npm run build` works locally first

### API Routes Timeout
- Default timeout is 10s; Vercel functions support up to 60s (configured in `vercel.json`)
- Check Supabase/Groq API response times

### Environment Variables Not Loading
- Ensure variables are set in Vercel project settings
- Variables must be set before deployment
- Redeploy after adding new environment variables

## Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`

## Building for Production

```bash
npm run build
npm run preview
```

## Additional Resources

- [TanStack Start Documentation](https://tanstack.com/router/latest/docs/framework/react/start)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Integration Guide](https://supabase.com/docs)

## Custom Domain

1. In Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records as per Vercel's instructions
4. SSL certificate is automatically provisioned

## Monitoring

- **Performance**: Vercel Analytics (enable in Project Settings)
- **Errors**: Error tracking via Vercel
- **Logs**: Function logs available in Vercel Dashboard

## Scaling

Vercel automatically scales your deployment:
- Serverless functions scale based on traffic
- Static files served via CDN globally
- No manual scaling needed

---

**Last Updated**: June 2026
**Framework**: TanStack Start + Vite
**Runtime**: Node.js 20+
