import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Pixel ID is required' },
        { status: 400 }
      )
    }

    const { data: pixel, error } = await supabase
      .from('pixels')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Pixel not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching pixel:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pixel' },
        { status: 500 }
      )
    }

    const trackerUrl = `/tracker/${pixel.id}.png`

    return NextResponse.json({
      id: pixel.id,
      email: pixel.email,
      created_at: pixel.created_at,
      tracker_url: trackerUrl,
    })
  } catch (error) {
    console.error('Error in GET /api/pixels/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

