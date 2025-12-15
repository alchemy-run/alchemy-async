// see: https://nuxt.com/docs/guide/directory-structure/server#server-middleware

export default defineEventHandler((event) => {
  event.context.auth = { user: 123 };
});
