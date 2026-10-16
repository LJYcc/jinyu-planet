export default defineEventHandler(event => {
  const origin = getRequestURL(event).origin;
  const routes = ['/', '/posts', '/write', '/about', '/ai-chat'];
  const urls = routes.map(path => `<url><loc>${origin}${path}</loc></url>`).join('');

  setHeader(event, 'content-type', 'application/xml; charset=UTF-8');
  setHeader(event, 'cache-control', 'public, max-age=3600');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
});
