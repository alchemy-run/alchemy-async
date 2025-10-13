# R2 Multipart Upload Implementation Plan

This document provides a comprehensive plan for implementing R2 Multipart Upload functionality in the Alchemy codebase. This follows the conventions established in `CLAUDE.md` and patterns from the existing `bucket.ts` implementation.

## Overview

R2 Multipart Upload allows uploading large objects in parts, enabling resumable uploads and better handling of large files. This implementation will add support for:

1. Creating multipart uploads
2. Uploading individual parts
3. Completing multipart uploads
4. Aborting multipart uploads
5. Resuming existing multipart uploads

## 1. Type Definitions

Add these type definitions to `alchemy/src/cloudflare/bucket.ts` after the existing R2 type definitions (around line 220):

```typescript
/**
 * Options for creating a multipart upload
 */
export interface R2MultipartOptions {
  /**
   * HTTP metadata for the object (Content-Type, Content-Language, etc.)
   */
  httpMetadata?: R2HTTPMetadata | Headers;

  /**
   * Custom metadata as key-value pairs
   */
  customMetadata?: Record<string, string>;

  /**
   * Storage class for the object
   */
  storageClass?: string;

  /**
   * Server-side encryption key (SSEC)
   */
  ssecKey?: ArrayBuffer | string;
}

/**
 * Options for uploading a part
 */
export interface R2UploadPartOptions {
  /**
   * Server-side encryption key (SSEC) for this part
   */
  ssecKey?: ArrayBuffer | string;
}

/**
 * Represents an uploaded part in a multipart upload
 */
export interface R2UploadedPart {
  /**
   * Part number (1-10000)
   */
  partNumber: number;

  /**
   * ETag of the uploaded part
   */
  etag: string;
}

/**
 * Represents a multipart upload session
 */
export interface R2MultipartUpload {
  /**
   * The key (path) of the object being uploaded
   */
  readonly key: string;

  /**
   * The upload ID for this multipart upload session
   */
  readonly uploadId: string;

  /**
   * Upload a part of the multipart upload
   *
   * @param partNumber Part number (1-10000)
   * @param value The part data to upload
   * @param options Optional upload options
   * @returns The uploaded part metadata
   */
  uploadPart(
    partNumber: number,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: R2UploadPartOptions,
  ): Promise<R2UploadedPart>;

  /**
   * Abort the multipart upload, removing all uploaded parts
   */
  abort(): Promise<void>;

  /**
   * Complete the multipart upload by combining all parts into the final object
   *
   * @param uploadedParts Array of uploaded parts in order
   * @returns The completed R2 object
   */
  complete(uploadedParts: R2UploadedPart[]): Promise<R2Object>;
}

/**
 * HTTP metadata for R2 objects
 */
export interface R2HTTPMetadata {
  contentType?: string;
  contentLanguage?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  cacheControl?: string;
  cacheExpiry?: Date;
}
```

## 2. API Functions

Add these API functions to `alchemy/src/cloudflare/bucket.ts` after the existing object operations (around line 900):

### 2.1 Create Multipart Upload

```typescript
/**
 * Create a multipart upload
 *
 * @see https://developers.cloudflare.com/api/operations/r2-create-multipart-upload
 */
export async function createMultipartUploadApi(
  api: CloudflareApi,
  {
    bucketName,
    key,
    options = {},
  }: {
    bucketName: string;
    key: string;
    options?: R2MultipartOptions;
  },
): Promise<{ key: string; uploadId: string }> {
  return await withRetries(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add HTTP metadata headers if provided
    if (options.httpMetadata) {
      if (options.httpMetadata instanceof Headers) {
        options.httpMetadata.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        if (options.httpMetadata.contentType) {
          headers["Content-Type"] = options.httpMetadata.contentType;
        }
        if (options.httpMetadata.contentLanguage) {
          headers["Content-Language"] = options.httpMetadata.contentLanguage;
        }
        if (options.httpMetadata.contentDisposition) {
          headers["Content-Disposition"] =
            options.httpMetadata.contentDisposition;
        }
        if (options.httpMetadata.contentEncoding) {
          headers["Content-Encoding"] = options.httpMetadata.contentEncoding;
        }
        if (options.httpMetadata.cacheControl) {
          headers["Cache-Control"] = options.httpMetadata.cacheControl;
        }
      }
    }

    // Add custom metadata as x-amz-meta-* headers
    if (options.customMetadata) {
      for (const [key, value] of Object.entries(options.customMetadata)) {
        headers[`x-amz-meta-${key}`] = value;
      }
    }

    // Add storage class if specified
    if (options.storageClass) {
      headers["x-amz-storage-class"] = options.storageClass;
    }

    // Add SSEC key if specified
    if (options.ssecKey) {
      const keyBuffer =
        typeof options.ssecKey === "string"
          ? new TextEncoder().encode(options.ssecKey)
          : options.ssecKey;
      // Note: Actual SSEC implementation would need proper key encoding
      headers["x-amz-server-side-encryption-customer-algorithm"] = "AES256";
    }

    const response = await api.post(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}/multipart`,
      {},
      { headers },
    );

    if (!response.ok) {
      throw await handleApiError(
        response,
        "create multipart upload",
        "object",
        key,
      );
    }

    const result = await extractCloudflareResult<{
      key: string;
      uploadId: string;
    }>(`create multipart upload for "${key}"`, Promise.resolve(response));

    return result;
  });
}
```

### 2.2 Upload Part

```typescript
/**
 * Upload a part for a multipart upload
 *
 * @see https://developers.cloudflare.com/api/operations/r2-upload-part
 */
export async function uploadPartApi(
  api: CloudflareApi,
  {
    bucketName,
    key,
    uploadId,
    partNumber,
    value,
    options = {},
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
    partNumber: number;
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob;
    options?: R2UploadPartOptions;
  },
): Promise<R2UploadedPart> {
  if (partNumber < 1 || partNumber > 10000) {
    throw new Error(`Part number must be between 1 and 10000, got ${partNumber}`);
  }

  return await withRetries(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };

    // Add SSEC key if specified
    if (options.ssecKey) {
      headers["x-amz-server-side-encryption-customer-algorithm"] = "AES256";
    }

    const response = await api.put(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}/multipart/${uploadId}/${partNumber}`,
      value,
      { headers },
    );

    if (!response.ok) {
      throw await handleApiError(
        response,
        "upload part",
        `object ${key} part ${partNumber}`,
        key,
      );
    }

    const etag = response.headers.get("ETag")?.replace(/"/g, "");
    if (!etag) {
      throw new Error(`No ETag returned for part ${partNumber}`);
    }

    return {
      partNumber,
      etag,
    };
  });
}
```

### 2.3 Complete Multipart Upload

```typescript
/**
 * Complete a multipart upload
 *
 * @see https://developers.cloudflare.com/api/operations/r2-complete-multipart-upload
 */
export async function completeMultipartUploadApi(
  api: CloudflareApi,
  {
    bucketName,
    key,
    uploadId,
    parts,
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
    parts: R2UploadedPart[];
  },
): Promise<R2Object> {
  return await withRetries(async () => {
    const response = await api.post(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}/multipart/${uploadId}/complete`,
      {
        parts: parts.map((p) => ({
          partNumber: p.partNumber,
          etag: p.etag,
        })),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw await handleApiError(
        response,
        "complete multipart upload",
        "object",
        key,
      );
    }

    return parseR2Object(key, response);
  });
}
```

### 2.4 Abort Multipart Upload

```typescript
/**
 * Abort a multipart upload
 *
 * @see https://developers.cloudflare.com/api/operations/r2-abort-multipart-upload
 */
export async function abortMultipartUploadApi(
  api: CloudflareApi,
  {
    bucketName,
    key,
    uploadId,
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
  },
): Promise<void> {
  return await withRetries(async () => {
    const response = await api.delete(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}/multipart/${uploadId}`,
    );

    if (!response.ok && response.status !== 404) {
      throw await handleApiError(
        response,
        "abort multipart upload",
        "object",
        key,
      );
    }
  });
}
```

## 3. R2Bucket Methods

Update the `R2Bucket` type definition (around line 230) to include multipart upload methods:

```typescript
export type R2Bucket = _R2Bucket & {
  head(key: string): Promise<R2ObjectMetadata | null>;
  get(key: string): Promise<R2Object | null>;
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
  ): Promise<PutR2ObjectResponse>;
  delete(key: string): Promise<Response>;
  list(options?: R2ListOptions): Promise<R2Objects>;

  // New multipart upload methods
  createMultipartUpload(
    key: string,
    options?: R2MultipartOptions,
  ): Promise<R2MultipartUpload>;
  resumeMultipartUpload(key: string, uploadId: string): R2MultipartUpload;
};
```

Update the `R2Bucket` function implementation (around line 380) to add the multipart methods:

```typescript
export async function R2Bucket(
  id: string,
  props: BucketProps = {},
): Promise<R2Bucket> {
  const api = await createCloudflareApi(props);
  const bucket = await _R2Bucket(id, {
    ...props,
    dev: {
      ...(props.dev ?? {}),
      force: Scope.current.local,
    },
  });

  // Helper function to create R2MultipartUpload object
  const createMultipartUploadObject = (
    key: string,
    uploadId: string,
  ): R2MultipartUpload => ({
    key,
    uploadId,
    uploadPart: async (
      partNumber: number,
      value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
      options?: R2UploadPartOptions,
    ) =>
      uploadPartApi(api, {
        bucketName: bucket.name,
        key,
        uploadId,
        partNumber,
        value,
        options,
      }),
    abort: async () =>
      abortMultipartUploadApi(api, {
        bucketName: bucket.name,
        key,
        uploadId,
      }),
    complete: async (parts: R2UploadedPart[]) =>
      completeMultipartUploadApi(api, {
        bucketName: bucket.name,
        key,
        uploadId,
        parts,
      }),
  });

  return {
    ...bucket,
    head: async (key: string) =>
      headObject(api, {
        bucketName: bucket.name,
        key,
      }),
    get: async (key: string) => {
      const response = await getObject(api, {
        bucketName: bucket.name,
        key,
      });
      if (response.ok) {
        return parseR2Object(key, response);
      } else if (response.status === 404) {
        return null;
      } else {
        throw await handleApiError(response, "get", "object", key);
      }
    },
    list: async (options?: R2ListOptions): Promise<R2Objects> =>
      listObjects(api, bucket.name, {
        ...options,
        jurisdiction: bucket.jurisdiction,
      }),
    put: async (
      key: string,
      value: PutObjectObject,
    ): Promise<PutR2ObjectResponse> => {
      const response = await putObject(api, {
        bucketName: bucket.name,
        key: key,
        object: value,
      });
      const body = (await response.json()) as {
        result: {
          key: string;
          etag: string;
          uploaded: string;
          version: string;
          size: string;
        };
      };
      return {
        key: body.result.key,
        etag: body.result.etag,
        uploaded: new Date(body.result.uploaded),
        version: body.result.version,
        size: Number(body.result.size),
      };
    },
    delete: async (key: string) =>
      deleteObject(api, {
        bucketName: bucket.name,
        key: key,
      }),

    // New multipart upload methods
    createMultipartUpload: async (
      key: string,
      options?: R2MultipartOptions,
    ): Promise<R2MultipartUpload> => {
      const result = await createMultipartUploadApi(api, {
        bucketName: bucket.name,
        key,
        options,
      });
      return createMultipartUploadObject(result.key, result.uploadId);
    },

    resumeMultipartUpload: (key: string, uploadId: string): R2MultipartUpload =>
      createMultipartUploadObject(key, uploadId),
  };
}
```

## 4. Test Cases

Add comprehensive test cases to `alchemy/test/cloudflare/bucket.test.ts`:

### 4.1 Basic Multipart Upload Test

```typescript
test("multipart upload - create, upload parts, and complete", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-basic`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "large-file.bin";
    const part1Data = "Part 1 data - first chunk of the file\n";
    const part2Data = "Part 2 data - second chunk of the file\n";
    const part3Data = "Part 3 data - final chunk of the file\n";

    // Create multipart upload
    const upload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType: "application/octet-stream",
      },
      customMetadata: {
        uploadedBy: "alchemy-test",
        testCase: "multipart-basic",
      },
    });

    expect(upload.key).toBe(key);
    expect(upload.uploadId).toBeTruthy();

    // Upload parts
    const part1 = await upload.uploadPart(1, part1Data);
    expect(part1.partNumber).toBe(1);
    expect(part1.etag).toBeTruthy();

    const part2 = await upload.uploadPart(2, part2Data);
    expect(part2.partNumber).toBe(2);
    expect(part2.etag).toBeTruthy();

    const part3 = await upload.uploadPart(3, part3Data);
    expect(part3.partNumber).toBe(3);
    expect(part3.etag).toBeTruthy();

    // Complete the upload
    const obj = await upload.complete([part1, part2, part3]);
    expect(obj.key).toBe(key);
    expect(obj.etag).toBeTruthy();

    // Verify the object exists and has correct content
    const retrievedObj = await bucket.get(key);
    expect(retrievedObj).toBeTruthy();
    const text = await retrievedObj!.text();
    expect(text).toBe(part1Data + part2Data + part3Data);
  } finally {
    await destroy(scope);
  }
});
```

### 4.2 Resume Multipart Upload Test

```typescript
test("multipart upload - resume existing upload", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-resume`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "resumable-file.bin";
    const part1Data = "First part uploaded initially\n";
    const part2Data = "Second part uploaded after resume\n";

    // Create multipart upload and upload first part
    const initialUpload = await bucket.createMultipartUpload(key);
    const uploadId = initialUpload.uploadId;
    const part1 = await initialUpload.uploadPart(1, part1Data);

    // Simulate a disconnection - resume the upload using the uploadId
    const resumedUpload = bucket.resumeMultipartUpload(key, uploadId);
    expect(resumedUpload.uploadId).toBe(uploadId);

    // Upload second part using resumed upload
    const part2 = await resumedUpload.uploadPart(2, part2Data);

    // Complete the upload
    const obj = await resumedUpload.complete([part1, part2]);
    expect(obj.key).toBe(key);

    // Verify content
    const retrievedObj = await bucket.get(key);
    const text = await retrievedObj!.text();
    expect(text).toBe(part1Data + part2Data);
  } finally {
    await destroy(scope);
  }
});
```

### 4.3 Abort Multipart Upload Test

```typescript
test("multipart upload - abort upload", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-abort`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "aborted-file.bin";

    // Create multipart upload and upload parts
    const upload = await bucket.createMultipartUpload(key);
    await upload.uploadPart(1, "Part 1 data");
    await upload.uploadPart(2, "Part 2 data");

    // Abort the upload
    await upload.abort();

    // Verify the object does not exist (parts were discarded)
    const obj = await bucket.get(key);
    expect(obj).toBeNull();

    // Attempting to complete an aborted upload should fail
    await expect(
      upload.complete([
        { partNumber: 1, etag: "dummy" },
        { partNumber: 2, etag: "dummy" },
      ]),
    ).rejects.toThrow();
  } finally {
    await destroy(scope);
  }
});
```

### 4.4 Error Handling Tests

```typescript
test("multipart upload - error handling", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-errors`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "error-test.bin";
    const upload = await bucket.createMultipartUpload(key);

    // Test invalid part number (must be 1-10000)
    await expect(upload.uploadPart(0, "data")).rejects.toThrow(
      /Part number must be between 1 and 10000/,
    );
    await expect(upload.uploadPart(10001, "data")).rejects.toThrow(
      /Part number must be between 1 and 10000/,
    );

    // Upload valid part
    const part1 = await upload.uploadPart(1, "Part 1");

    // Test completing with missing parts (only part 1 uploaded, but trying to use part 2)
    await expect(
      upload.complete([
        part1,
        { partNumber: 2, etag: "invalid-etag" },
      ]),
    ).rejects.toThrow();

    // Test completing with wrong ETags
    await expect(
      upload.complete([{ partNumber: 1, etag: "wrong-etag" }]),
    ).rejects.toThrow();

    // Clean up
    await upload.abort();
  } finally {
    await destroy(scope);
  }
});
```

### 4.5 Large File Upload Test

```typescript
test("multipart upload - large file with multiple parts", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-large`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "large-file.bin";
    const partSize = 5 * 1024 * 1024; // 5MB per part (minimum for R2)
    const numParts = 3;

    const upload = await bucket.createMultipartUpload(key);
    const parts: R2UploadedPart[] = [];

    // Upload multiple parts
    for (let i = 1; i <= numParts; i++) {
      // Create a buffer of the specified size
      const data = new Uint8Array(partSize);
      // Fill with some pattern (part number repeated)
      data.fill(i);

      const part = await upload.uploadPart(i, data);
      parts.push(part);
      expect(part.partNumber).toBe(i);
    }

    // Complete the upload
    const obj = await upload.complete(parts);
    expect(obj.key).toBe(key);
    expect(obj.size).toBe(partSize * numParts);

    // Verify object exists
    const metadata = await bucket.head(key);
    expect(metadata).toBeTruthy();
    expect(metadata!.size).toBe(partSize * numParts);
  } finally {
    await destroy(scope);
  }
});
```

### 4.6 Multipart Upload with Custom Metadata Test

```typescript
test("multipart upload - with custom metadata and http headers", async (scope) => {
  const bucketName = `${BRANCH_PREFIX.toLowerCase()}-multipart-metadata`;
  let bucket: R2Bucket | undefined;

  try {
    bucket = await R2Bucket(bucketName, {
      name: bucketName,
      adopt: true,
      empty: true,
    });

    const key = "metadata-file.txt";
    const upload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType: "text/plain",
        contentLanguage: "en-US",
        contentDisposition: 'attachment; filename="download.txt"',
        cacheControl: "max-age=3600",
      },
      customMetadata: {
        author: "alchemy-test",
        version: "1.0.0",
        environment: "test",
      },
    });

    const part1 = await upload.uploadPart(1, "Custom metadata test content");
    await upload.complete([part1]);

    // Verify the object was created
    const obj = await bucket.get(key);
    expect(obj).toBeTruthy();
    expect(obj!.key).toBe(key);
  } finally {
    await destroy(scope);
  }
});
```

## 5. REST API Endpoints Reference

The implementation uses the following Cloudflare R2 REST API endpoints:

### Create Multipart Upload
- **Method:** `POST`
- **Endpoint:** `/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{key}/multipart`
- **Headers:** Content-Type, custom metadata (x-amz-meta-*), HTTP metadata headers
- **Response:** `{ key: string, uploadId: string }`

### Upload Part
- **Method:** `PUT`
- **Endpoint:** `/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{key}/multipart/{upload_id}/{part_number}`
- **Headers:** Content-Type: application/octet-stream
- **Response:** ETag header contains the part ETag

### Complete Multipart Upload
- **Method:** `POST`
- **Endpoint:** `/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{key}/multipart/{upload_id}/complete`
- **Body:** `{ parts: [{ partNumber: number, etag: string }] }`
- **Response:** R2 object metadata

### Abort Multipart Upload
- **Method:** `DELETE`
- **Endpoint:** `/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{key}/multipart/{upload_id}`
- **Response:** 204 No Content on success

## 6. Implementation Checklist

- [ ] Add type definitions (R2MultipartOptions, R2UploadPartOptions, R2UploadedPart, R2MultipartUpload, R2HTTPMetadata)
- [ ] Implement createMultipartUploadApi() function
- [ ] Implement uploadPartApi() function
- [ ] Implement completeMultipartUploadApi() function
- [ ] Implement abortMultipartUploadApi() function
- [ ] Update R2Bucket type to include multipart methods
- [ ] Update R2Bucket function to implement createMultipartUpload()
- [ ] Update R2Bucket function to implement resumeMultipartUpload()
- [ ] Add test: basic multipart upload flow
- [ ] Add test: resume multipart upload
- [ ] Add test: abort multipart upload
- [ ] Add test: error handling (invalid part numbers, missing parts)
- [ ] Add test: large file with multiple parts
- [ ] Add test: custom metadata and HTTP headers
- [ ] Run `bun biome check --fix`
- [ ] Run `bun run test` to verify all tests pass
- [ ] Update bucket.ts documentation if needed

## 7. Key Implementation Notes

1. **Part Number Validation**: Part numbers must be between 1 and 10000 (inclusive)

2. **Part Size Requirements**: 
   - Minimum part size: 5MB (except for the last part)
   - Maximum part size: 5GB
   - Maximum object size: 5TB

3. **ETag Handling**: 
   - Each uploaded part returns an ETag
   - ETags must be preserved and passed to complete() in order
   - ETags are case-sensitive and should include quotes handling

4. **Error Handling**:
   - Use withRetries() for all API calls for reliability
   - Handle 404 responses appropriately (upload doesn't exist)
   - Validate part numbers before making API calls

5. **Retry Logic**: 
   - Reuse existing `withRetries()` helper
   - Use `isRetryableError()` from existing code

6. **Metadata Handling**:
   - HTTP metadata maps to standard headers (Content-Type, etc.)
   - Custom metadata uses x-amz-meta-* prefix
   - Storage class uses x-amz-storage-class header

7. **Testing Strategy**:
   - Use deterministic, non-random IDs with BRANCH_PREFIX
   - Clean up resources in finally blocks
   - Test both success and failure cases
   - Verify eventual consistency with appropriate delays

8. **Following Existing Patterns**:
   - Mirror the structure of existing object operations (put, get, delete)
   - Use extractCloudflareResult() for response parsing
   - Use handleApiError() for error handling
   - Follow the same naming conventions and code style

## 8. Documentation Updates

After implementation, consider updating:

1. Add JSDoc examples to the R2Bucket function showing multipart upload usage
2. Update any relevant guides in `alchemy-web/docs/` if they reference file uploads
3. Consider adding a dedicated guide for large file uploads using multipart

## 9. Future Enhancements (Out of Scope)

These are NOT part of this implementation but could be added later:

- List incomplete multipart uploads
- Automatic chunking helper for large files
- Progress tracking/callbacks
- Parallel part uploads
- Automatic retry with exponential backoff for individual parts
- Stream-based multipart upload utility
