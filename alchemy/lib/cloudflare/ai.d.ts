/**
 * Cloudflare Workers AI binding for running machine learning models.
 *
 * The AI binding provides access to Cloudflare's Workers AI platform, allowing you to run
 * inference on various AI models including text generation, image classification, embeddings,
 * and more directly from your Workers.
 *
 * @example
 * ```ts
 * import { Worker, Ai } from "alchemy/cloudflare";
 *
 * const ai = Ai();
 *
 * await Worker("my-worker", {
 *   name: "my-worker",
 *   entrypoint: "./src/worker.ts",
 *   bindings: {
 *     AI: ai
 *   }
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/workers-ai/
 */
export declare function Ai<Models extends AiModelListType = AiModelListType>(): {
    readonly type: "ai";
    readonly _phantom: Models;
};
export type Ai<Models extends AiModelListType = AiModelListType> = {
    type: "ai";
    /**
     * @internal
     */
    _phantom: Models;
};
//# sourceMappingURL=ai.d.ts.map