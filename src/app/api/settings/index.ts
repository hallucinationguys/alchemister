// We can't export both route handlers directly because they might have conflicting export names
// Instead, we'll export the route paths for reference

export const routes = {
  profile: '/api/settings/profile',
  providers: '/api/settings/providers',
}
