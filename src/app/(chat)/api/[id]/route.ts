import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')
    const { id } = await params

    const backendResponse = await fetch(`${api_url}/conversations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch conversation' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')
    const { id } = await params

    const backendResponse = await fetch(`${api_url}/conversations/${id}/title`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to update conversation title' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')
    const { id } = await params

    const backendResponse = await fetch(`${api_url}/conversations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
    })

    if (!backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(
        { error: data.error?.message || 'Failed to delete conversation' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({ success: true })
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
