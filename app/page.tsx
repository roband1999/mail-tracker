import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CreatePixelForm from '@/app/components/CreatePixelForm'

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

async function getUniqueOpenedPixels() {
  // Get all pixel_ids that have at least one event
  const { data, error } = await supabase
    .from('events')
    .select('pixel_id')

  if (error) {
    console.error('Error fetching opened pixels:', error)
    return 0
  }

  if (!data || data.length === 0) return 0

  // Get unique pixel_ids
  const uniquePixelIds = new Set(data.map((event) => event.pixel_id))
  return uniquePixelIds.size
}

async function getPixelOpenStatus(pixelId: string) {
  // Use count to explicitly check if any events exist for this pixel
  const { count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('pixel_id', pixelId)
    .limit(1)

  // If there's an error, assume not opened
  if (error) {
    console.error('Error checking pixel open status:', error)
    return false
  }

  // Count should be a number - if > 0, pixel has been opened
  return typeof count === 'number' && count > 0
}

export default async function Home() {
  const pixels = await getPixels()

  // Calculate stats
  const totalPixels = pixels.length
  const openedEmails = await getUniqueOpenedPixels()
  const conversionRate =
    totalPixels > 0 ? ((openedEmails / totalPixels) * 100).toFixed(1) : '0.0'

  // Get open status for each pixel
  const pixelsWithStatus = await Promise.all(
    pixels.map(async (pixel) => {
      const isOpened = await getPixelOpenStatus(pixel.id)
      return {
        ...pixel,
        isOpened,
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
                    Opened
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
                      colSpan={4}
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
                        {pixel.isOpened ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
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
