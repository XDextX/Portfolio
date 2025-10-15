# Tests helpers

This file documents the small helper utilities available in `tests/helpers/github-mocks.ts` and how to use them in Vitest tests.

Helpers provided

- `mockGitHubSearchResponse(items)` — returns a Response-like successful search result with `{ items }`.
- `mockGitHubRepoResponse(repo)` — returns a single-repo Response-like object or a 404 response when `repo` is `null`.
- `mockErrorResponse(status, body)` — produce a non-OK response with a custom status and optional body.
- `sequenceFetch(responses)` — returns a function suitable for stubbing `fetch` which will return the next response in `responses` on each call.

Usage examples

Simple search stub:

```ts
import { vi } from 'vitest';
import { mockGitHubSearchResponse } from './helpers/github-mocks';

vi.stubGlobal('fetch', () => mockGitHubSearchResponse([{ id: 1, name: 'repo' }]));
// ... run your code that calls fetch
```

Single repo stub:

```ts
import { vi } from 'vitest';
import { mockGitHubRepoResponse } from './helpers/github-mocks';

vi.stubGlobal('fetch', () => mockGitHubRepoResponse(repo));
// ... run your code
```

Sequence example (retry/pagination):

```ts
import { vi } from 'vitest';
import { sequenceFetch, mockErrorResponse, mockGitHubSearchResponse } from './helpers/github-mocks';

// First call returns 500, second returns a valid search response
vi.stubGlobal('fetch', sequenceFetch([
  mockErrorResponse(500),
  mockGitHubSearchResponse([{ id: 2, name: 'retry-repo' }])
]));

// ... run code that retries on error
```

Cleanup

Always restore or unstub globals after your tests to avoid leaking stubs into other tests:

```ts
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
});
```

Tips

- Keep helper imports relative to the `tests/` folder (e.g. `./helpers/github-mocks`).
- If you need a more realistic Response object, extend the helpers with additional properties (headers, redirect, etc.).
