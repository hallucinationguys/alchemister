// We can't export both route handlers directly because they have conflicting export names
// Instead, we'll export the route paths for reference

export const routes = {
  conversation: '/api/chat/conversations/:id',
  messages: '/api/chat/conversations/:id/messages',
}
