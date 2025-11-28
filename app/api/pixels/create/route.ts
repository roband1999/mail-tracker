import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
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

    return NextResponse.json({
      id: pixel.id,
      email: pixel.email,
      created_at: pixel.created_at,
      tracker_url: trackerUrl,
    })
  } catch (error) {
    console.error('Error in POST /api/pixels/create:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

