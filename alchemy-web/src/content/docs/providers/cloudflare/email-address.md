---
title: EmailAddress
description: Learn how to manage destination email addresses for Cloudflare email routing using Alchemy.
---

Manage destination email addresses that can receive emails forwarded by Cloudflare Email Service routing rules.

:::caution
Email Routing resources do not work with `wrangler login` (OAuth tokens) due to permission limitations. You must use an API token instead with the following scopes:

- **Zone:Read** - to read zone information
- **Zone:Edit** - to manage email routing settings

See the [Cloudflare guide](/guides/cloudflare/) for details on setting up API token authentication.
:::

## Minimal Example

Add a destination email address:

```ts
import { EmailAddress } from "alchemy/cloudflare";

await EmailAddress("admin-email", {
  email: "admin@company.com",
});
```

## Multiple Destination Addresses

Create multiple destination addresses for different purposes:

```ts
import { EmailAddress } from "alchemy/cloudflare";

const supportEmail = await EmailAddress("support-email", {
  email: "support@company.com",
});

const salesEmail = await EmailAddress("sales-email", {
  email: "sales@company.com",
});

const adminEmail = await EmailAddress("admin-email", {
  email: "admin@company.com",
});
```

## Email Verification

Email addresses must be verified before they can receive forwarded emails:

```ts
import { EmailAddress } from "alchemy/cloudflare";

const emailAddress = await EmailAddress("my-email", {
  email: "destination@company.com",
});

// Check verification status
console.log(`Verified: ${emailAddress.verified}`);
console.log(`Verified at: ${emailAddress.verifiedAt}`);
```

## Special Characters in Email

Handle email addresses with special characters:

```ts
import { EmailAddress } from "alchemy/cloudflare";

await EmailAddress("special-email", {
  email: "user+tag@example.com",
});

await EmailAddress("subdomain-email", {
  email: "admin@subdomain.example.com",
});
```

## Properties

### Input Properties

- `email` (string): Destination email address for routing

### Output Properties

- `addressId` (string): Stable Cloudflare identifier for the destination address
- `email` (string): The email address
- `verified` (boolean): Whether the email address has been verified
- `verifiedAt` (string, optional): Timestamp returned by Cloudflare once the address is verified
- `created` (string): When the email address was created
- `modified` (string): When the email address was last modified
- `tag` (string, optional): Deprecated Cloudflare tag field when present

## Email Verification Process

1. **Create Address**: When you create an EmailAddress resource, it's added to your account but starts unverified
2. **Verification Email**: Cloudflare sends a verification email to the destination address
3. **User Confirms**: The recipient must click the verification link in the email
4. **Address Verified**: Once verified, the address can receive forwarded emails

## Using with Email Rules

Destination addresses are used in email routing rules:

```ts
import { EmailAddress, EmailRule } from "alchemy/cloudflare";

const adminEmail = await EmailAddress("admin-email", {
  email: "admin@company.com",
});

await EmailRule("admin-forwarding", {
  zone: "example.com",
  name: "Forward admin emails",
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "admin@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: [adminEmail.email],
    },
  ],
});
```

## Best Practices

### Email Address Management

- **Verify Quickly**: Ask recipients to check their email and verify addresses promptly
- **Use Descriptive Names**: Use clear resource names that indicate the address purpose
- **Monitor Status**: Check verification status before setting up routing rules

### Security Considerations

- **Trust Recipients**: Only add email addresses you trust to receive forwarded emails
- **Review Regularly**: Periodically review and remove unused destination addresses
- **Limit Access**: Consider who has access to destination addresses in your organization

## Limitations

- Email addresses must be verified before they can receive forwarded emails
- Verification requires action from the email recipient
- Some email providers may block or filter forwarded emails

## Troubleshooting

### Address Not Receiving Emails

1. **Check Verification**: Ensure the address is verified
2. **Check Spam Folder**: Verification emails might be in spam
3. **Retry Verification**: Delete and recreate the address if needed

### Verification Email Not Received

1. **Check Email Provider**: Some providers block automated emails
2. **Try Different Address**: Use an alternative email address if possible
3. **Contact Support**: Reach out to Cloudflare support for assistance

## Learn More

- [Cloudflare Email Service route emails guide](https://developers.cloudflare.com/email-service/get-started/route-emails/)
- [Cloudflare Email Service email routing rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
