# Deploying to Vercel

This guide will help you deploy the Email Tracking Application to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. Your code pushed to a repository
3. A Supabase project with the database schema set up
4. A Vercel account (sign up at [vercel.com](https://vercel.com))

## Deployment Steps

### 1. Push Your Code to Git

If you haven't already, initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repository-url>
git push -u origin main
```

### 2. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will automatically detect it's a Next.js project

### 3. Configure Environment Variables

In the Vercel project settings, add these environment variables:

1. Go to your project → **Settings** → **Environment Variables**
2. Add the following variables:

   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`
     **Value:** Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

   - **Name:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
     **Value:** Your Supabase Publishable key (found in Supabase Settings → API)

3. Make sure to add them for all environments (Production, Preview, Development)
4. Click **"Save"**

### 4. Deploy

1. Click **"Deploy"** in the Vercel dashboard
2. Vercel will automatically:
   - Install dependencies (`npm install`)
   - Build your project (`npm run build`)
   - Deploy to a production URL

### 5. Verify Deployment

Once deployed, you'll get a URL like `https://your-project.vercel.app`

1. Visit your deployment URL
2. Test creating a pixel
3. Test the tracker URL by visiting `https://your-project.vercel.app/tracker/{pixel-id}.png`
4. Check the dashboard to see if events are being logged

## Important Notes

### Tracker URLs

After deployment, your tracker URLs will be:
```
https://your-project.vercel.app/tracker/{pixel-id}.png
```

Make sure to use the full URL when embedding tracking pixels in emails.

### Database Setup

Ensure you've run the SQL schema (`supabase-schema.sql`) in your Supabase project before deploying.

### Custom Domain (Optional)

1. Go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions

## Troubleshooting

### Build Errors

- Check that all environment variables are set correctly
- Verify your Supabase project is accessible
- Check the build logs in Vercel dashboard

### Tracker Not Working

- Verify the tracker route is accessible: `https://your-project.vercel.app/tracker/test.png`
- Check Supabase logs to see if events are being inserted
- Verify environment variables are set correctly

### Database Connection Issues

- Double-check your Supabase URL and Publishable key
- Ensure your Supabase project is active
- Check Supabase dashboard for any connection issues

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For other branches, it creates preview deployments.

## Environment Variables Reference

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

