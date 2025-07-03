'use client'

import { Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

interface ApiKeyErrorProps {
  error: string
  onRetry?: () => void
  className?: string
}

const ApiKeyError = ({ error, onRetry, className = '' }: ApiKeyErrorProps) => {
  // Check if this is an API key configuration error
  const isApiKeyError =
    error.includes('API key') &&
    (error.includes('not configured') || error.includes('not active') || error.includes('not set'))

  if (!isApiKeyError) {
    // Not an API key error, render generic error
    return (
      <Alert className={className}>
        <AlertDescription>{error}</AlertDescription>
        {onRetry && (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        )}
      </Alert>
    )
  }

  // Extract provider name from error message
  const providerMatch = error.match(/provider '([^']+)'/)
  const providerName = providerMatch ? providerMatch[1] : 'the AI provider'

  return (
    <Card className={`max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-warning" />
        </div>
        <CardTitle className="text-lg">API Key Required</CardTitle>
        <CardDescription>
          You need to configure your {providerName} API key to start chatting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>To get started:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Go to Settings → Model Providers</li>
            <li>Find {providerName} and click &ldquo;Setup&rdquo;</li>
            <li>Enter your API key and save</li>
            <li>Return here to start chatting</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild className="flex-1">
            <Link href="/settings/model-providers">
              <Settings className="w-4 h-4 mr-2" />
              Configure API Key
            </Link>
          </Button>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            Don&apos;t have an API key?{' '}
            <Link
              href={getProviderSignupUrl(providerName)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              Get one here <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get signup URLs for different providers
function getProviderSignupUrl(providerName: string): string {
  const urls: Record<string, string> = {
    OpenAI: 'https://platform.openai.com/api-keys',
    Anthropic: 'https://console.anthropic.com/',
    Google: 'https://ai.google.dev/',
    Mistral: 'https://console.mistral.ai/',
    // Add more providers as needed
  }

  return urls[providerName] || '#'
}

export default ApiKeyError
