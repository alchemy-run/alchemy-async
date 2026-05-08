---
title: Hetzner
description: Manage Hetzner Cloud servers, networks, firewalls, storage, and DNS resources using Alchemy.
---

Hetzner is a German cloud provider offering affordable, high-performance virtual machines, block storage, object storage, networking, load balancers, and DNS — all accessible through a clean REST API. Alchemy gives you full lifecycle management over these resources as typed TypeScript constructs.

[Hetzner Cloud](https://www.hetzner.com/cloud) | [Cloud API Reference](https://docs.hetzner.cloud/)

## Resources

- [SSHKey](/providers/hetzner/ssh-key) - Manage SSH public keys for server authentication
- [Network](/providers/hetzner/network) - Private networks for server-to-server communication
- [Firewall](/providers/hetzner/firewall) - Stateful firewall rules (inbound/outbound)
- [Server](/providers/hetzner/server) - Virtual machines
- [Volume](/providers/hetzner/volume) - Block storage volumes
- [LoadBalancer](/providers/hetzner/load-balancer) - Managed load balancers
- [FloatingIP](/providers/hetzner/floating-ip) - Static public IP addresses
- [Bucket](/providers/hetzner/bucket) - S3-compatible object storage
- [DNSZone](/providers/hetzner/dns-zone) - DNS zones via Hetzner DNS API
- [DNSRecord](/providers/hetzner/dns-record) - DNS records within a zone

## Example Usage

```ts
import alchemy from "alchemy";
import {
  SSHKey,
  Network,
  Firewall,
  Server,
  Volume,
  LoadBalancer,
  FloatingIP,
  Bucket,
  DNSZone,
  DNSRecord,
} from "alchemy/hetzner";

const app = await alchemy("my-app");

// Upload your SSH public key for server access
const sshKey = await SSHKey("deploy-key", {
  name: "deploy-key",
  publicKey: alchemy.secret.env.SSH_PUBLIC_KEY,
});

// Create a private network for internal communication
const network = await Network("app-network", {
  name: "app-network",
  ipRange: "10.0.0.0/16",
  subnets: [
    { type: "cloud", networkZone: "eu-central", ipRange: "10.0.1.0/24" },
  ],
});

// Define firewall rules — allow SSH and HTTPS inbound
const firewall = await Firewall("app-firewall", {
  name: "app-firewall",
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "22",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Allow SSH",
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "443",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Allow HTTPS",
    },
  ],
});

// Attach a persistent block storage volume
const dataVolume = await Volume("data-volume", {
  name: "data-volume",
  size: 50,
  location: "nbg1",
  format: "ext4",
});

// Provision two app servers in the same network
const server1 = await Server("app-server-1", {
  name: "app-server-1",
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
  sshKeys: [sshKey],
  networks: [network],
  firewalls: [firewall],
  volumes: [dataVolume],
  userData: `#!/bin/bash
apt-get update -y
apt-get install -y nodejs npm
`,
});

const server2 = await Server("app-server-2", {
  name: "app-server-2",
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
  sshKeys: [sshKey],
  networks: [network],
  firewalls: [firewall],
});

// Load balancer distributing HTTPS traffic across both servers
const lb = await LoadBalancer("app-lb", {
  name: "app-lb",
  loadBalancerType: "lb11",
  location: "nbg1",
  algorithm: { type: "round_robin" },
  services: [
    {
      protocol: "tcp",
      listenPort: 443,
      destinationPort: 443,
      healthCheck: {
        protocol: "tcp",
        port: 443,
        interval: 15,
        timeout: 10,
        retries: 3,
      },
    },
  ],
  targets: [
    { type: "server", server: server1 },
    { type: "server", server: server2 },
  ],
  network: network,
});

// Reserve a static public IP and point it at the load balancer
const publicIp = await FloatingIP("app-ip", {
  name: "app-ip",
  type: "ipv4",
  homeLocation: "nbg1",
  server: lb,
});

// S3-compatible object storage bucket for user uploads
const uploadsBucket = await Bucket("uploads", {
  name: "my-app-uploads",
});

// DNS zone for the domain
const dnsZone = await DNSZone("app-zone", {
  name: "example.com",
});

// A record pointing the apex domain at the floating IP
const apexRecord = await DNSRecord("apex-a", {
  zone: dnsZone,
  name: "@",
  type: "A",
  value: publicIp.ip,
  ttl: 300,
});

// www subdomain CNAME
const wwwRecord = await DNSRecord("www-cname", {
  zone: dnsZone,
  name: "www",
  type: "CNAME",
  value: "example.com.",
  ttl: 300,
});

await app.finalize();

export const ip = publicIp.ip;
export const domain = dnsZone.name;
export const bucketEndpoint = uploadsBucket.endpoint;
```
