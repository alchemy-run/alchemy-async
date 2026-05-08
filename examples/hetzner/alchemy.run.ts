import alchemy from "alchemy";
import {
  Bucket,
  DNSRecord,
  DNSZone,
  Firewall,
  FloatingIP,
  Network,
  Server,
  SSHKey,
} from "alchemy/hetzner";

const app = await alchemy("hetzner-example");

// SSH key — populate HETZNER_SSH_PUBLIC_KEY with your public key
const sshKey = await SSHKey("deploy-key", {
  publicKey: process.env.HETZNER_SSH_PUBLIC_KEY ?? "",
});

// Private network with a /24 subnet in Falkenstein
const network = await Network("private-net", {
  ipRange: "10.0.0.0/16",
  subnets: [
    {
      type: "cloud",
      networkZone: "eu-central",
      ipRange: "10.0.1.0/24",
    },
  ],
});

// Firewall: allow HTTP, HTTPS, and SSH inbound; allow all outbound
const firewall = await Firewall("web-firewall", {
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "22",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "SSH",
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "80",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "HTTP",
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "443",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "HTTPS",
    },
    {
      direction: "out",
      protocol: "tcp",
      port: "1-65535",
      destinationIps: ["0.0.0.0/0", "::/0"],
      description: "All outbound TCP",
    },
    {
      direction: "out",
      protocol: "udp",
      port: "1-65535",
      destinationIps: ["0.0.0.0/0", "::/0"],
      description: "All outbound UDP",
    },
  ],
});

// Ubuntu 24.04 server (cx22) in Falkenstein, attached to the network and firewall
const server = await Server("web-server", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "fsn1",
  sshKeys: [sshKey.name],
  networks: [String(network.id)],
  firewalls: [String(firewall.id)],
  userData: `#!/bin/bash
apt-get update -y
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx`,
});

// Object Storage bucket in Falkenstein
// Credentials via HETZNER_ACCESS_KEY_ID and HETZNER_SECRET_ACCESS_KEY env vars
const bucket = await Bucket("assets", {
  region: "fsn1",
});

// Floating IP assigned to the server
const floatingIp = await FloatingIP("web-ip", {
  type: "ipv4",
  homeLocation: "fsn1",
  server,
});

// Optional DNS — only created when HETZNER_DOMAIN is set
const domain = process.env.HETZNER_DOMAIN;
if (domain) {
  const zone = await DNSZone("zone", { name: domain });
  await DNSRecord("a-record", {
    zone,
    name: "@",
    type: "A",
    value: floatingIp.ip,
    ttl: 300,
  });
  console.log(`DNS A record: ${domain} → ${floatingIp.ip}`);
}

console.log(`Server IP:      ${server.publicNet.ipv4?.ip}`);
console.log(`Floating IP:    ${floatingIp.ip}`);
console.log(`Bucket endpoint: ${bucket.endpoint}`);
console.log(`Bucket domain:   ${bucket.bucketDomainName}`);

await app.finalize();
