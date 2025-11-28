# Email Tracking Application

A lightweight email tracking application built with Next.js and Supabase that tracks email opens using tracking pixels.

## Features

- **Pixel Generation**: Create unique tracking pixels with UUIDs
- **Open Tracking**: Track email opens with IP address and user-agent logging
- **Web Dashboard**: View statistics, pixel list, and detailed event logs
- **RESTful API**: Create and fetch pixels via API endpoints

## Setup

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your Supabase database:

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor:

```sql
-- Create pixels table
CREATE TABLE IF NOT EXISTS pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tracker_url TEXT GENERATED ALWAYS AS ('/tracker/' || id::text || '.png') STORED
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pixel_id UUID NOT NULL REFERENCES pixels(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index on pixel_id for faster queries
CREATE INDEX IF NOT EXISTS idx_events_pixel_id ON events(pixel_id);

-- Create index on opened_at for faster date queries
CREATE INDEX IF NOT EXISTS idx_events_opened_at ON events(opened_at);
```

3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

   You can find these values in your Supabase project settings under API:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** → use for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Pixel

1. Use the form on the dashboard to create a new pixel by entering an email address
2. Or use the API endpoint:

```bash
curl -X POST http://localhost:3000/api/pixels/create \
  -H "Content-Type: application/json" \
  -d '{"email": "example@email.com"}'
```

The response will include a `tracker_url` that you can embed in your emails as an image:

```html
<img src="https://yourdomain.com/tracker/{pixel-id}.png" alt="" />
```

### Fetching a Pixel

```bash
curl http://localhost:3000/api/pixels/{pixel-id}
```

### Viewing Dashboard

- **Home Page** (`/`): View summary statistics and all pixels
- **Logs Page** (`/pixels/{id}/logs`): View detailed event logs for a specific pixel

## API Endpoints

- `POST /api/pixels/create` - Create a new tracking pixel
- `GET /api/pixels/[id]` - Fetch pixel details by ID
- `GET /tracker/[id].png` - Tracking pixel endpoint (serves 1x1 transparent PNG and logs the open event)

## Project Structure

```
mail-tracker/
├── app/
│   ├── api/
│   │   └── pixels/
│   │       ├── create/
│   │       └── [id]/
│   ├── pixels/
│   │   └── [id]/
│   │       └── logs/
│   ├── tracker/
│   │   └── [...slug]/
│   ├── components/
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── supabase.ts
│   └── png.ts
└── supabase-schema.sql
```

## Deployment

This application is ready to deploy to Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy!

## Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - Database and backend
- **Tailwind CSS** - Styling
