# Hetzner Example

This example provisions a complete web-hosting setup on Hetzner Cloud using the Alchemy Hetzner provider:

- **SSH Key** — for server access
- **Private Network** with a `/24` subnet (`10.0.1.0/24`)
- **Firewall** — allows inbound HTTP (80), HTTPS (443), and SSH (22)
- **Server** — `cx22` running Ubuntu 24.04 in `fsn1` (Falkenstein), with nginx pre-installed via cloud-init
- **Object Storage Bucket** — S3-compatible bucket in `fsn1`
- **Floating IP** — static IPv4 address assigned to the server
- **DNS A record** (optional) — points your domain's apex to the floating IP

## Prerequisites

- [Bun](https://bun.sh) installed
- A Hetzner Cloud account and API token
- A Hetzner Object Storage S3 access key pair (for the bucket)

## Configuration

Set the following environment variables (or add them to `../../.env`):

| Variable | Description |
|---|---|
| `HETZNER_API_TOKEN` | Hetzner Cloud API token |
| `HETZNER_SSH_PUBLIC_KEY` | Your SSH public key (e.g. contents of `~/.ssh/id_ed25519.pub`) |
| `HETZNER_ACCESS_KEY_ID` | Hetzner Object Storage access key ID |
| `HETZNER_SECRET_ACCESS_KEY` | Hetzner Object Storage secret access key |
| `HETZNER_DOMAIN` | *(optional)* Domain name for the DNS A record |
| `HETZNER_DNS_API_TOKEN` | *(optional)* Hetzner DNS API token — required when `HETZNER_DOMAIN` is set |

## Running

```bash
cd examples/hetzner

# Deploy
bun run deploy

# Destroy all resources
bun run destroy
```

After a successful deploy the script prints the server IP, floating IP, and bucket endpoint.
