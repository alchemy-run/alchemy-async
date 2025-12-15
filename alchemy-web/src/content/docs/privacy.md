---
title: Privacy Policy
lastUpdated: 2025-08-02
---

## 1. Introduction

Thank you for using **Alchemy**. We respect your privacy and are committed to being transparent about the data we collect, why we collect it, and how you can control it. This Privacy Policy explains how the Alchemy CLI, runtime libraries, and associated websites (collectively, "Alchemy") collect and process information when you install, run, or otherwise use Alchemy.

## 2. Information We Collect

Alchemy is designed to collect *anonymous* usage analytics that help us understand how our tools are used and improve their reliability and performance. We do **not** collect names, email addresses, source code, or any directly identifying personal information. Specifically, the telemetry system built into the Alchemy CLI gathers the following data:

### 2.1. Identifiers

- **User ID (UUID)** - generated once per machine and stored locally on your system. *Not collected when running in Continuous Integration (CI) environments.*
- **Session ID (UUID)** - generated for each invocation of Alchemy to correlate events within a single run.
- **Project ID** - the root Git commit hash of the repository in which you run Alchemy. This provides a stable, anonymous identifier for a project without exposing its contents.

### 2.2. System Information

- Operating system platform and version (e.g. "darwin 24.1.0").
- CPU architecture (e.g. `x64`) and logical CPU count.
- Total system memory (in MB).
- Runtime name and version (`bun`, `node`, `deno`, or `workerd`).
- Environment provider (e.g. "GitHub Actions", "Vercel") and whether the process is executing in a CI environment.

### 2.3. Usage Events

For each session, Alchemy records a series of timestamped events including, but not limited to:

- Application lifecycle events
- Resource operations together with the resource type, status (creating / updating / deleting / etc.), elapsed time, and whether an existing resource was replaced.
- State-store operations including class name, operation performed, and elapsed time.
- Error information: error name, message, and stack trace. Prior to transmission we automatically redact any absolute paths that include your home directory by replacing them with `~`.

## 3. How We Use the Information

We use the collected information to:

- Monitor stability and diagnose crashes or failures.
- Measure feature adoption and prioritize future development.
- Analyse performance characteristics (e.g., average resource-creation time) to improve speed and reliability.

## 4. Legal Basis for Processing

Our processing of the aforementioned information is based on our legitimate interest in improving our products and services (per Art. 6 (1) f GDPR) while minimising privacy impact by collecting only anonymous and aggregated data.

## 5. Where the Data Is Sent & Stored

Telemetry events are batched and sent over HTTPS to [PostHog's cloud service](https://posthog.com/). PostHog is a trusted third-party analytics provider that stores data on their secure cloud infrastructure. Access to our PostHog project is restricted to authorised Alchemy maintainers and is protected with industry-standard security practices.

## 6. Retention

We retain telemetry data in accordance with our legitimate business needs and legal requirements. Data is stored in PostHog's cloud service according to their data retention policies. We periodically review and delete data that is no longer necessary for the purposes outlined in this policy.

## 7. Opt-Out

You can disable telemetry at any time by setting one of the following environment variables before running Alchemy:

```sh
export ALCHEMY_TELEMETRY_DISABLED=1
# or
export DO_NOT_TRACK=1
```

If telemetry is disabled, the Alchemy CLI will not transmit any analytics data for that session.

## 8. Data Sharing

We do **not** sell or rent telemetry data. Data may be shared with service providers strictly for the purposes outlined in this policy (e.g., PostHog for analytics processing or cloud infrastructure providers hosting our telemetry servers). We may also disclose data if required by law.

## 9. Security

We implement appropriate technical and organisational measures to protect telemetry data against unauthorised access, alteration, disclosure, or destruction.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. Continued use of Alchemy after such changes constitutes acceptance of the revised policy.

## 11. Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us at [privacy@alchemy.run](mailto:privacy@alchemy.run).
