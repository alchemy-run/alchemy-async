// see: https://nuxt.com/docs/guide/directory-structure/server#server-middleware

export default defineEventHandler((event) => {
  console.log("New request: " + getRequestURL(event));
});
