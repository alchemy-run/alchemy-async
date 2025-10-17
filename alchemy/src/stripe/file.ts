import type Stripe from "stripe";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { createStripeClient, isStripeConflictError } from "./client.ts";

/**
 * Properties for creating a Stripe file
 */
export interface FileProps {
  /**
   * A file to upload. The file should follow the specifications of RFC 2388
   */
  file: any;
  /**
   * The purpose of the uploaded file
   */
  purpose: Stripe.FileCreateParams.Purpose;
  /**
   * Optional parameters for the file link data
   */
  fileLink?: {
    /**
     * Whether to create a file link for the uploaded file
     */
    create: boolean;
    /**
     * The time at which the file link expires
     */
    expiresAt?: number;
    /**
     * Set of key-value pairs that you can attach to the file link
     */
    metadata?: Record<string, string>;
  };

  /**
   * API key to use (overrides environment variable)
   */
  apiKey?: Secret;

  /**
   * If true, adopt existing resource if creation fails due to conflict
   */
  adopt?: boolean;
}

/**
 * Output from the Stripe file
 */
export interface File {
  /**
   * The ID of the file
   */
  id: string;
  /**
   * String representing the object's type
   */
  object: "file";
  /**
   * Time at which the object was created
   */
  created: number;
  /**
   * The time at which the file expires and is no longer available
   */
  expiresAt?: number;
  /**
   * A filename for the file, suitable for saving to a filesystem
   */
  filename?: string;
  /**
   * Any links that have been created for the file
   */
  links?: {
    object: "list";
    data: Array<{
      id: string;
      object: "file_link";
      created: number;
      expired: boolean;
      expiresAt?: number;
      file: string;
      livemode: boolean;
      metadata: Record<string, string>;
      url?: string;
    }>;
    hasMore: boolean;
    url: string;
  };
  /**
   * The purpose of the uploaded file
   */
  purpose: Stripe.File.Purpose;
  /**
   * The size in bytes of the file object
   */
  size: number;
  /**
   * A user friendly title for the document
   */
  title?: string;
  /**
   * The type of the file returned
   */
  type?: string;
  /**
   * The URL from which the file can be downloaded
   */
  url?: string;
  /**
   * Has the value true if the object exists in live mode or the value false if the object exists in test mode
   */
  livemode: boolean;
}

/**
 * Create and manage Stripe files for uploads
 *
 * @example
 * // Upload a dispute evidence file
 * const disputeEvidence = await File("dispute-evidence", {
 *   file: await fs.promises.readFile("./evidence.pdf"),
 *   purpose: "dispute_evidence"
 * });
 *
 * @example
 * // Upload an identity document
 * const identityDocument = await File("identity-doc", {
 *   file: await fs.promises.readFile("./passport.jpg"),
 *   purpose: "identity_document"
 * });
 *
 * @example
 * // Upload a business logo with file link
 * const businessLogo = await File("business-logo", {
 *   file: await fs.promises.readFile("./logo.png"),
 *   purpose: "business_logo",
 *   fileLink: {
 *     create: true,
 *     expiresAt: Math.floor(Date.now() / 1000) + 86400,
 *     metadata: {
 *       brand: "company_logo"
 *     }
 *   }
 * });
 */
export const File = Resource(
  "stripe::File",
  async function (
    this: Context<File>,
    _id: string,
    props: FileProps,
  ): Promise<File> {
    const adopt = props.adopt ?? this.scope.adopt;
    const stripe = await createStripeClient({ apiKey: props.apiKey });

    if (this.phase === "delete") {
      return this.destroy();
    }

    try {
      let file: Stripe.File;

      if (this.phase === "update" && this.output?.id) {
        file = await stripe.files.retrieve(this.output.id);
      } else {
        try {
          file = await stripe.files.create({
            file: props.file,
            purpose: props.purpose,
          });
        } catch (error) {
          if (isStripeConflictError(error) && adopt) {
            throw new Error(
              "File adoption is not supported - files are immutable and cannot be adopted",
            );
          } else {
            throw error;
          }
        }
      }

      return {
        id: file.id,
        object: file.object,
        created: file.created,
        expiresAt: file.expires_at || undefined,
        filename: file.filename || undefined,
        links: file.links
          ? {
              object: file.links.object,
              data: file.links.data.map((link) => ({
                id: link.id,
                object: link.object,
                created: link.created,
                expired: link.expired,
                expiresAt: link.expires_at || undefined,
                file: typeof link.file === "string" ? link.file : link.file.id,
                livemode: link.livemode,
                metadata: link.metadata,
                url: link.url || undefined,
              })),
              hasMore: file.links.has_more,
              url: file.links.url,
            }
          : undefined,
        purpose: file.purpose as Stripe.File.Purpose,
        size: file.size,
        title: file.title || undefined,
        type: file.type || undefined,
        url: file.url || undefined,
        livemode: true,
      };
    } catch (error) {
      logger.error("Error creating/retrieving file:", error);
      throw error;
    }
  },
);
