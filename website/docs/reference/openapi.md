---
title: OpenAPI Spec
description: Eve API discovery, spec registration, and service API documentation.
sidebar_position: 10
---

# OpenAPI Spec

Eve supports OpenAPI spec registration for service discovery and API documentation.

## Registering specs

Add an `api_spec` block to your service:

```yaml
services:
  api:
    x-eve:
      api_spec:
        type: openapi
        spec_url: /openapi.json
```

## Discovery

Registered specs are available through the Eve API for agent discovery and documentation generation.
