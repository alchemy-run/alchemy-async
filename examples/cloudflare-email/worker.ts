import { EmailMessage } from "cloudflare:email";
import { WorkerEntrypoint } from "cloudflare:workers";
import { createMimeMessage } from "mimetext";
import type { worker } from "./alchemy.run.ts";

const SENDER_EMAIL = "sender@example.com";
const RECIPIENT_EMAIL = "recipient@example.com";

export default class extends WorkerEntrypoint<typeof worker.Env> {
  async fetch(request: Request): Promise<Response> {
    if (request.url.endsWith("/email")) {
      const reply = createEmailMessage(
        SENDER_EMAIL,
        RECIPIENT_EMAIL,
        "Another message from your bot",
        "Your bot doesn't like you, but that's ok. It's just a bot.",
      );
      const message = await this.env.SEND_EMAIL.send(reply);
      return Response.json(message);
    }
    return new Response("Hello World", { status: 200 });
  }

  async email(message: ForwardableEmailMessage): Promise<void> {
    const reply = createEmailMessage(
      SENDER_EMAIL,
      message.from,
      "Another message from your bot",
      "Your bot doesn't like you, but that's ok. It's just a bot.",
      message.headers.get("Message-ID"),
    );
    console.log("sending reply");
    await message.reply(reply);
    console.log("reply sent");
  }
}

function createEmailMessage(
  sender: string,
  recipient: string,
  subject: string,
  body: string,
  inReplyTo?: string | null,
): EmailMessage {
  const msg = createMimeMessage();
  if (inReplyTo) {
    msg.setHeader("In-Reply-To", inReplyTo);
  }
  msg.setSender(sender);
  msg.setRecipient(recipient);
  msg.setSubject(subject);
  msg.addMessage({
    contentType: "text/plain",
    data: body,
  });
  return new EmailMessage(sender, recipient, msg.asRaw());
}
