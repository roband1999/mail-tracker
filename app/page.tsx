import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CreatePixelForm from '@/app/components/CreatePixelForm'

// Force dynamic rendering to ensure fresh data on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPixels() {
  const { data, error } = await supabase
    .from('pixels')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pixels:', error)
    return []
  }

  return data || []
}

async function getLinksForPixel(pixelId: string) {
  const { data, error } = await supabase
    .from('links')
    .select('id, destination_url')
    .eq('pixel_id', pixelId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching links:', error)
    return []
  }

  return data || []
}

async function getLinkClickCount(linkId: string) {
  const { count, error } = await supabase
    .from('link_events')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)

  if (error) {
    console.error('Error checking link click count:', error)
    return 0
  }

  return typeof count === 'number' ? count : 0
}

async function getUniqueOpenedPixels() {
  // Get all events with their pixel creation dates
  const { data, error } = await supabase
    .from('events')
    .select('pixel_id, opened_at, pixels!inner(created_at)')

  if (error) {
    console.error('Error fetching opened pixels:', error)
    return 0
  }

  if (!data || data.length === 0) return 0

  // Filter out events within 10 seconds of pixel creation
  const validEvents = data.filter((event: any) => {
    const pixelCreatedAt = new Date(event.pixels.created_at).getTime()
    const eventOpenedAt = new Date(event.opened_at).getTime()
    const timeDiff = (eventOpenedAt - pixelCreatedAt) / 1000 // difference in seconds
    return timeDiff >= 10
  })

  // Get unique pixel_ids from valid events
  const uniquePixelIds = new Set(validEvents.map((event: any) => event.pixel_id))
  return uniquePixelIds.size
}

async function getPixelEventCount(pixelId: string) {
  // First get the pixel to know its creation date
  const { data: pixel, error: pixelError } = await supabase
    .from('pixels')
    .select('created_at')
    .eq('id', pixelId)
    .single()

  if (pixelError || !pixel) {
    console.error('Error fetching pixel:', pixelError)
    return 0
  }

  // Calculate the threshold (pixel creation + 10 seconds)
  const pixelCreatedAt = new Date(pixel.created_at)
  const threshold = new Date(pixelCreatedAt.getTime() + 10 * 1000).toISOString()

  // Get events that occurred after the threshold
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('pixel_id', pixelId)
    .gt('opened_at', threshold)

  // If there's an error, assume 0 events
  if (error) {
    console.error('Error checking pixel event count:', error)
    return 0
  }

  // Return the count, defaulting to 0 if undefined
  return typeof count === 'number' ? count : 0
}

export default async function Home() {
  const pixels = await getPixels()

  // Calculate stats
  const totalPixels = pixels.length
  const openedEmails = await getUniqueOpenedPixels()
  const conversionRate =
    totalPixels > 0 ? ((openedEmails / totalPixels) * 100).toFixed(1) : '0.0'

  // Get event count and links for each pixel
  const pixelsWithStatus = await Promise.all(
    pixels.map(async (pixel) => {
      const eventCount = await getPixelEventCount(pixel.id)
      const links = await getLinksForPixel(pixel.id)
      const linksWithClickCount = await Promise.all(
        links.map(async (link) => {
          const clickCount = await getLinkClickCount(link.id)
          return {
            ...link,
            clickCount,
          }
        })
      )
      return {
        ...pixel,
        eventCount,
        links: linksWithClickCount,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Email Tracking Dashboard
        </h1>

        {/* Create Pixel Form */}
        <CreatePixelForm />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Total Pixels
            </h2>
            <p className="text-3xl font-bold text-gray-900">{totalPixels}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Opened Emails
            </h2>
            <p className="text-3xl font-bold text-gray-900">{openedEmails}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Read Conversion
            </h2>
            <p className="text-3xl font-bold text-gray-900">
              {conversionRate}%
            </p>
          </div>
        </div>

        {/* Pixels Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Pixels</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Links
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pixelsWithStatus.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No pixels created yet
                    </td>
                  </tr>
                ) : (
                  pixelsWithStatus.map((pixel) => (
                    <tr key={pixel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {pixel.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pixel.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pixel.eventCount > 0 ? (
                          <div className="tooltip-container">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-default">
                              OPENED
                            </span>
                            <div className="tooltip">
                              Opened {pixel.eventCount} time{pixel.eventCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="tooltip-container">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 cursor-default">
                              DELIVERED
                            </span>
                            <div className="tooltip">
                              Not opened yet (no events)
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {pixel.links && pixel.links.length > 0 ? (
                            pixel.links.map((link: any) => {
                              const truncatedUrl =
                                link.destination_url.length > 30
                                  ? link.destination_url.substring(0, 27) + '...'
                                  : link.destination_url
                              const hasClicks = link.clickCount > 0
                              return (
                                <div key={link.id} className="tooltip-container">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-default ${hasClicks
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                      }`}
                                  >
                                    {truncatedUrl}
                                  </span>
                                  <div className="tooltip">
                                    {link.destination_url}
                                    <br />
                                    Clicked {link.clickCount} time{link.clickCount !== 1 ? 's' : ''}
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-gray-400 text-xs">No links</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/pixels/${pixel.id}/logs`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Logs
                        </Link>
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
