'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePixelForm() {
  const [email, setEmail] = useState('')
  const [links, setLinks] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Filter out empty links
      const validLinks = links.filter((link) => link.trim())

      const response = await fetch('/api/pixels/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          links: validLinks.length > 0 ? validLinks : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create pixel')
      }

      // Build success message
      let successMessage = `Pixel created! Tracker URL: ${data.tracker_url}`
      if (data.tracking_links && data.tracking_links.length > 0) {
        successMessage += '\n\nTracking Links:'
        data.tracking_links.forEach((link: { tracking_url: string; destination_url: string }) => {
          successMessage += `\n${link.tracking_url} → ${link.destination_url}`
        })
      }

      setSuccess(successMessage)
      setEmail('')
      setLinks([''])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addLink = () => {
    setLinks([...links, ''])
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, value: string) => {
    const newLinks = [...links]
    newLinks[index] = value
    setLinks(newLinks)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Create New Pixel
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="example@email.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Links (Optional)
            </label>
            <button
              type="button"
              onClick={addLink}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Link
            </button>
          </div>
          {links.map((link, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={link}
                onChange={(e) => updateLink(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(index)}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded whitespace-pre-line">
            {success}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Pixel'}
        </button>
      </form>
    </div>
  )
}

