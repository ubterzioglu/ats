# F.6 Ghost Posting Check — Security Review

**Date:** 2026-10-04  
**Reviewer:** Agent  
**Status:** APPROVED

## Summary

F.6 introduces the first server route since P0.2 removed the analyze proxy. The route
checks whether a job posting is still live by querying Greenhouse, Lever, or Ashby
public APIs. It carries no candidate data, preserving principle 2 (CV never leaves the
browser by default).

## Threat Model

### 1. SSRF (Server-Side Request Forgery)

**Risk:** Attacker supplies a malicious URL that causes the server to make requests to
internal services or arbitrary external hosts.

**Mitigation:**
- Host allowlist hardcoded in `PLATFORM_HOSTS`: only `boards.greenhouse.io`,
  `api.lever.co`, `api.ashbyhq.com`. No user-supplied URL.
- `board` validated with `/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/` — no slashes, dots, or
  special characters. Cannot escape the path segment.
- `jobId` validated with `/^[a-z0-9][a-z0-9_-]{0,127}$/` — alphanumeric, underscore,
  hyphen only. Cannot inject path separators.
- `redirect: "error"` in fetch options prevents following redirects to other hosts.
- URL constructed with `encodeURIComponent` on user inputs.

**Verdict:** MITIGATED. Path traversal and host injection are structurally impossible.

### 2. Data Exfiltration

**Risk:** Attacker causes the server to send candidate data (CV text, name, email) to
an external host.

**Mitigation:**
- Request body validated to contain only `{platform, board, jobId}`. Extra fields
  rejected.
- `GhostCheckInput` interface has no fields for CV text, name, email, or any candidate
  data.
- No cookies forwarded (fetch defaults to `credentials: "same-origin"`, which does not
  send cookies cross-origin).
- No headers forwarded from the incoming request.

**Verdict:** MITIGATED. Candidate data is structurally excluded from the request.

### 3. Denial of Service

**Risk:** Attacker causes the server to make slow or large requests that exhaust
resources.

**Mitigation:**
- 8-second timeout via `AbortController`.
- 512KB response size limit; response reading aborts if exceeded.
- No retry logic; one request per invocation.

**Verdict:** MITIGATED. Time and memory are bounded.

### 4. Information Disclosure

**Risk:** Error messages or logs reveal internal details (file paths, stack traces,
internal hostnames).

**Mitigation:**
- All errors return `{ status: "unknown" }`. No error details exposed to the client.
- No logging of request bodies, URLs, or responses.
- No stack traces in error responses.

**Verdict:** MITIGATED. Errors are opaque.

### 5. Injection

**Risk:** Attacker injects malicious content into the URL or request that is executed
by the server or the target API.

**Mitigation:**
- All user inputs validated with strict regex before use.
- URL constructed with `encodeURIComponent`, preventing injection of special characters.
- No shell commands executed; only `fetch` called.

**Verdict:** MITIGATED. Injection is structurally impossible.

## Code Review

### Input Validation (`validateGhostInput`)

```typescript
const allowedKeys = new Set(["platform", "board", "jobId"]);
for (const key of Object.keys(record)) {
  if (!allowedKeys.has(key)) return null;
}
```

✓ Extra fields rejected. Prevents future fields from being accidentally processed.

```typescript
if (platform !== "greenhouse" && platform !== "lever" && platform !== "ashby") return null;
```

✓ Platform is an enum, not a string. No arbitrary values accepted.

```typescript
if (typeof board !== "string" || !BOARD_RX.test(board)) return null;
if (typeof jobId !== "string" || !JOB_ID_RX.test(jobId)) return null;
```

✓ Type checks before regex. Regex is strict (anchored, character class whitelist).

### URL Construction (`buildUrl`)

```typescript
const host = PLATFORM_HOSTS[input.platform];
if (!host) return null;
```

✓ Host comes from a hardcoded map, not user input.

```typescript
return `https://${host}/${encodeURIComponent(input.board)}/embed.json`;
```

✓ `encodeURIComponent` prevents path traversal even if regex were bypassed.

### Network Request (`performGhostCheck`)

```typescript
const response = await fetch(url, {
  method: "GET",
  signal: controller.signal,
  redirect: "error",
  headers: { Accept: "application/json" }
});
```

✓ `redirect: "error"` prevents following redirects.  
✓ No `credentials` option (defaults to "same-origin", does not send cookies cross-origin).  
✓ No custom headers forwarded from the incoming request.

```typescript
if (totalBytes > MAX_RESPONSE_BYTES) {
  reader.cancel().catch(() => {});
  return { status: "unknown" };
}
```

✓ Response size bounded. Reader cancelled if exceeded.

```typescript
} catch {
  return { status: "unknown" };
}
```

✓ All errors caught and returned as "unknown". No exceptions propagate.

## Test Coverage

16 tests in `tests/ghost-check.test.ts`:

- Input validation: extra fields rejected, unknown platform rejected, empty board
  rejected, path traversal rejected, special characters rejected, non-object input
  rejected, missing fields rejected.
- SSRF protection: no candidate data in proxy, URL built from fixed host allowlist.
- Network behavior: 404 returns "gone", network error returns "unknown", server error
  returns "unknown", no cookies forwarded.
- Invalid URL construction: board with slashes returns "unknown", jobId with spaces
  returns "unknown".

All tests pass.

## Deployment

The route is included in the Next.js build output:

```
Route (app)                                 Size  First Load JS
├ ƒ /api/ghost-check                         ...
```

The route is server-side rendered on demand (ƒ), not statically generated. It will be
available after the next deploy.

## Conclusion

The F.6 ghost posting check is secure. All identified threats are mitigated through
structural constraints (input validation, host allowlist, regex enforcement) rather than
runtime checks. The route carries no candidate data, preserving the privacy contract.

**Recommendation:** APPROVED for deployment.

## Future Considerations

1. **Rate limiting:** Not implemented. If abuse is observed, add rate limiting per IP or
   per API key.
2. **Caching:** Not implemented. If the same job is checked repeatedly, consider caching
   results for a short period (e.g., 5 minutes).
3. **Monitoring:** No logging. If debugging is needed, add structured logging of request
   metadata (platform, board, jobId) but not the response body.
4. **Additional platforms:** If more job boards are needed, add them to `PLATFORM_HOSTS`
   and update the regex if necessary. Each new platform should be reviewed for SSRF risk.
