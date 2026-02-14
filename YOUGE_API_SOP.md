# SOP: Youge (Sanyu) API Access & Integration

This document provides technical instructions for interacting with the Youge (Sanyu) Open API for reading and writing data. Use this SOP for future developers to ensure consistent integration with the Giga-Youge ecosystem.

---

## 1. Authentication Credentials

The API requires four primary parameters, which are managed as environment variables in the Cloudflare Worker:

| Parameter | Env Variable | Description |
| :--- | :--- | :--- |
| **App Token** | `YOUGE_APP_TOKEN` | Bearer token for authentication. |
| **App Code** | `YOUGE_APP_CODE` | Unique identifier for the Youge application. |
| **Engine Code** | `YOUGE_ENGINE_CODE` | Identifies the specific Sanyu engine instance. |
| **Schema Code** | `YOUGE_SCHEMA_CODE` | Identifies the table/data model (e.g., Products, Orders). |

> [!IMPORTANT]
> Always use the **Production** or **Development** specific codes defined in `wrangler.toml` to avoid cross-contamination of data.

---

## 2. Request Headers

Every request to the Youge API must include the following headers:

```http
Authorization: Bearer <YOUGE_APP_TOKEN>
X-H3-AppCode: <YOUGE_APP_CODE>
X-H3-EngineCode: <YOUGE_ENGINE_CODE>
Content-Type: application/json
```

---

## 3. Data Operations (Common Patterns)

### 3.1 Reading Multiple Records (Pagination)
To fetch batches of data, use the `records` endpoint.

- **URL**: `POST https://sanyu.cloud/openapi/records/{AppCode}/{SchemaCode}`
- **Payload**:
```json
{
  "offset": 0,
  "limit": 100
}
```
- **Note**: The API returns records in blocks. You should implement a `while` loop to increment the `offset` until `records.length === 0`.

### 3.2 Updating an Existing Record
Use partial updates (PATCH) to modify specific fields without overwriting the entire record.

- **URL**: `PATCH https://sanyu.cloud/openapi/record/{AppCode}/{SchemaCode}/{ObjectId}`
- **Payload**:
```json
{
  "F000008K6": "25",
  "F000008KE": "49.99"
}
```
- **Warning**: Fields must be mapped to their **Field IDs** (e.g., `F00000...`). Do not use display names.

### 3.3 Adding a New Record
- **URL**: `POST https://sanyu.cloud/openapi/record/{AppCode}/{SchemaCode}`
- **Payload**: Same as Update, but without the `ObjectId` in the URL.

---

## 4. Field Mapping Reference

Below are the critical Field IDs currently used in the Catalog Sync:

### Table: Products (Listing Prod Master)
- **SKU**: `F00000AFP`
- **Quantity Available**: `F00000AGE`
- **Discounted Price**: `F00000AGL`
- **Availability Status**: `F00000B0I`
- **More On The Way**: `F00000AGW`
- **Arrival Date**: `F00000AGX`

---

## 5. Error Handling Best Practices

1. **HTTP status 200 is not enough**: Always check the JSON response for `success: true` or `data: true`.
2. **Rate Limiting**: The Youge API can return 429 errors. Implement **Exponential Backoff** retry logic (see `withRetry` in `worker.js`).
3. **Data Types**: The API is strict with strings vs numbers. When in doubt, cast values to `String()`.

---
*Created by Antigravity AI - System Documentation v1.0*
