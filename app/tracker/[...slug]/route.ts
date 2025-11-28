import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TRANSPARENT_PNG } from '@/lib/png'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params
    const path = slug.join('/')

    // Extract pixel ID - remove .png extension if present
    const pixelId = path.replace(/\.png$/, '')

    if (!pixelId) {
      return new NextResponse(TRANSPARENT_PNG, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // Extract IP address and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the event to Supabase
    const { error } = await supabase.from('events').insert({
      pixel_id: pixelId,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error('Error logging event:', error)
      // Still return the pixel even if logging fails
    }

    // Return 1x1 transparent PNG
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Length': TRANSPARENT_PNG.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in GET /tracker/[...slug]:', error)
    // Still return the pixel even on error
    return new NextResponse(TRANSPARENT_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  }
}

