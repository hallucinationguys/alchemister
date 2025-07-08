export const formatMessageTime = (dateString: string): string => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  } catch {
    return ''
  }
}

export const formatConversationDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return formatMessageTime(dateString)
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    }
  } catch {
    return 'Unknown time'
  }
}

export const scrollToBottom = (containerId: string) => {
  const container = document.getElementById(containerId)
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

export const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const isValidMessage = (content: string): boolean => {
  return content.trim().length > 0
}
