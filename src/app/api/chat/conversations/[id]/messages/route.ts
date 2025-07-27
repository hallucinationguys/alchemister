import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')
    const { id } = await context.params

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    const backendResponse = await fetch(
      `${api_url}/conversations/${id}/messages?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token || '',
        },
      }
    )

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch messages' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')
    const { id } = await context.params

    const backendResponse = await fetch(`${api_url}/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to post message' },
        { status: backendResponse.status }
      )
    }

    // Check if the backend response is streaming (SSE)
    const contentType = backendResponse.headers.get('content-type')
    if (contentType?.includes('text/event-stream')) {
      // Create a new ReadableStream to handle SSE
      const stream = new ReadableStream({
        start(controller) {
          const reader = backendResponse.body?.getReader()
          if (!reader) {
            controller.close()
            return
          }

          const handleRead = () => {
            reader
              .read()
              .then(({ done, value }) => {
                if (done) {
                  controller.close()
                  return
                }

                // Forward the chunk from backend to frontend
                controller.enqueue(value)
                handleRead()
              })
              .catch(error => {
                console.error('Stream read error:', error)
                controller.error(error)
              })
          }

          handleRead()
        },
      })

      // Return SSE response
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // If not streaming, return regular JSON response
    const data = await backendResponse.json()
    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
