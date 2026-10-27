export function postLoginPath(router, value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/'
  const route = router.resolve(value)
  return route.matched.length && !route.meta.guest ? route.fullPath : '/'
}
