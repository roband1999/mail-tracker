import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, links } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate links if provided
    if (links !== undefined && !Array.isArray(links)) {
      return NextResponse.json(
        { error: 'Links must be an array' },
        { status: 400 }
      )
    }

    // Generate UUID and insert pixel
    const { data: pixel, error } = await supabase
      .from('pixels')
      .insert({
        email: email.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating pixel:', error)
      return NextResponse.json(
        { error: 'Failed to create pixel' },
        { status: 500 }
      )
    }

    // Generate tracker URL
    const trackerUrl = `/tracker/${pixel.id}.png`

    // Create links if provided
    const trackingLinks = []
    if (links && Array.isArray(links) && links.length > 0) {
      // Filter out empty strings and validate URLs
      const validLinks = links
        .filter((link: string) => link && typeof link === 'string' && link.trim())
        .map((link: string) => link.trim())

      if (validLinks.length > 0) {
        const linkRecords = validLinks.map((destinationUrl: string) => ({
          pixel_id: pixel.id,
          destination_url: destinationUrl,
        }))

        const { data: createdLinks, error: linksError } = await supabase
          .from('links')
          .insert(linkRecords)
          .select()

        if (linksError) {
          console.error('Error creating links:', linksError)
          // Continue even if link creation fails
        } else if (createdLinks) {
          // Generate tracking URLs for each link
          trackingLinks.push(
            ...createdLinks.map((link) => ({
              id: link.id,
              destination_url: link.destination_url,
              tracking_url: `/tracker/link/${link.id}`,
            }))
          )
        }
      }
    }

    return NextResponse.json({
      id: pixel.id,
      email: pixel.email,
      created_at: pixel.created_at,
      tracker_url: trackerUrl,
      tracking_links: trackingLinks,
    })
  } catch (error) {
    console.error('Error in POST /api/pixels/create:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

