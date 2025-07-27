import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const token = request.headers.get('Authorization')

    const backendResponse = await fetch(`${api_url}/providers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch providers' },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
