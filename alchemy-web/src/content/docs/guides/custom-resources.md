---
title: Custom Resource
description: Learn how to build your own custom infrastructure resources for Alchemy using AI-assistance. Extend Alchemy to support any cloud service or API.
sidebar:
  order: 6
---

In Alchemy, a Resource is "just a function". This makes it super easy to generate resources for your use-cases using Agentic IDEs like Cursor, Claude Code, Windsurf, etc.

## Cursorrules

To start generating resources, copy Alchemy's [.cursorrules](https://github.com/alchemy-run/alchemy/blob/main/.cursorrules) into your repo

:::note
All of Alchemy's "built-in" resouces are generated this way, so it is tried and tested.
:::

## Simple Prompt Example

As an example, let's show how easy it is to generate a resource for Neon's famous serverless `Database` Resource.

It usually doesn't take much to get 90% of the way there - a simple prompt with a link to the API docs is a good start:

> Create a Resource for managing a Neon Database
> See: https://api-docs.neon.tech/reference/createprojectbranchdatabase

This will generate the Resource implementation and tests.

## Resource Implememtation

See the [Resource Documentation](/concepts/resource) for a comprehensive overview of a Resource.

## Test Suite Implementation

See the [Testing Documentation](/concepts/testing) for a comprehensive overview of how to test your Resources.
