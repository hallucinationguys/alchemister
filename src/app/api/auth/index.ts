// We can't export both route handlers directly because they both export a POST function
// Instead, we'll export the route paths for reference

export const routes = {
  login: '/api/auth/login',
  verify: '/api/auth/verify',
}
