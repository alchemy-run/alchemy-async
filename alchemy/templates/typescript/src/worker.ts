export default {
  async fetch(): Promise<Response> {
    return new Response("Hello World from my-alchemy-app!");
  },
};
