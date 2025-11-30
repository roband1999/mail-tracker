import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.redirect(new URL('/', request.url), { status: 302 })
    }

    // Fetch link record from database
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('destination_url')
      .eq('id', id)
      .single()

    if (linkError || !link) {
      console.error('Error fetching link:', linkError)
      // Redirect to a safe fallback or home page
      return NextResponse.redirect(new URL('/', request.url), { status: 302 })
    }

    // Extract IP address and user agent
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Log the click event to Supabase
    const { error: eventError } = await supabase.from('link_events').insert({
      link_id: id,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (eventError) {
      console.error('Error logging link event:', eventError)
      // Continue with redirect even if logging fails
    }

    // Redirect to destination URL
    return NextResponse.redirect(link.destination_url, { status: 302 })
  } catch (error) {
    console.error('Error in GET /tracker/link/[id]:', error)
    // Redirect to home page on error
    return NextResponse.redirect(new URL('/', request.url), { status: 302 })
  }
}

