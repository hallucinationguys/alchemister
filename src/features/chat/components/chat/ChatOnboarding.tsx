'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ChatOnboardingProps {
  className?: string
}

// Move trading quotes outside component to prevent recreation on every render
const TRADING_QUOTES = [
  'What are you working on?',
  'Ready to analyze the markets?',
  "Let's dive into trading strategies",
  'How can I help with your portfolio?',
  'What market insights do you need?',
  'Ready to explore trading opportunities?',
  "Let's discuss market trends",
  'How can I assist with your trades?',
  'What financial data should we analyze?',
  'Ready to optimize your trading approach?',
  "Let's review market conditions",
  'What trading questions do you have?',
  'How can I help with risk management?',
  'Ready to explore investment options?',
  "Let's analyze price movements",
  'What market research do you need?',
  'How can I assist with technical analysis?',
  'Ready to discuss trading psychology?',
  "Let's examine market volatility",
  'What trading tools should we explore?',
] as const

/**
 * Onboarding screen with random trading quotes for AI assistant.
 * Clean, minimal design focused on trading and market insights.
 */
const ChatOnboarding = ({ className = '' }: ChatOnboardingProps) => {
  const [currentQuote, setCurrentQuote] = useState('')

  useEffect(() => {
    // Select a random quote on component mount
    const randomIndex = Math.floor(Math.random() * TRADING_QUOTES.length)
    setCurrentQuote(TRADING_QUOTES[randomIndex])
  }, []) // Empty dependency array since TRADING_QUOTES is now stable

  return (
    <div
      className={cn('flex flex-1 items-center justify-center min-h-[calc(100vh-200px)]', className)}
    >
      <div className="text-center px-4 max-w-lg mx-auto">
        {/* Trading Icon */}
        <div className="relative mb-8">
          <div className="flex size-16 sm:size-20 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-blue-600 text-white shadow-lg">
            <TrendingUp className="size-8 sm:size-10" />
          </div>
        </div>

        {/* Random Quote */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {currentQuote || 'What are you working on?'}
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Your AI trading assistant is ready to help with market analysis, trading strategies, and
            financial insights.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatOnboarding
