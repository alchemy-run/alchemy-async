export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/html") {
      await env.EMAIL.send({
        from: "noreply@example.com",
        to: "hello@example.com",
        subject: "Welcome to Cloudflare Email Service",
        html: "<h1>Welcome</h1><p>This email was sent from Alchemy.</p>",
        text: "Welcome. This email was sent from Alchemy.",
      });

      return new Response("Sent HTML email.");
    }

    await env.EMAIL.send({
      from: "noreply@example.com",
      to: "hello@example.com",
      subject: "Plain text email",
      text: "This email was sent from Alchemy.",
    });

    return new Response("Sent plain-text email.");
  },
};

interface Env {
  EMAIL: SendEmail;
}
