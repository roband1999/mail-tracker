import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPixel(id: string) {
  const { data, error } = await supabase
    .from('pixels')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

async function getEvents(pixelId: string) {
  // First get the pixel to know its creation date
  const { data: pixel, error: pixelError } = await supabase
    .from('pixels')
    .select('created_at')
    .eq('id', pixelId)
    .single()

  if (pixelError || !pixel) {
    console.error('Error fetching pixel:', pixelError)
    return []
  }

  // Calculate the threshold (pixel creation + 10 seconds)
  const pixelCreatedAt = new Date(pixel.created_at)
  const threshold = new Date(pixelCreatedAt.getTime() + 10 * 1000).toISOString()

  // Get events that occurred after the threshold
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('pixel_id', pixelId)
    .gt('opened_at', threshold)
    .order('opened_at', { ascending: false })

  if (error) {
    console.error('Error fetching events:', error)
    return []
  }

  return data || []
}

export default async function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pixel = await getPixel(id)
  const events = await getEvents(id)

  if (!pixel) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-900 mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Pixel Logs
        </h1>

        {/* Pixel Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pixel Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900">{pixel.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="text-base text-gray-900">
                {new Date(pixel.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pixel ID</p>
              <p className="text-base text-gray-900 font-mono text-sm">
                {pixel.id}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tracker URL</p>
              <p className="text-base text-gray-900 font-mono text-sm break-all">
                /tracker/{pixel.id}.png
              </p>
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Open Events ({events.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pixel ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No events recorded yet
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(event.opened_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {event.ip_address}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {event.user_agent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pixel.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono text-xs">
                        {event.pixel_id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

