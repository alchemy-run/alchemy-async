export type Kind = "managed" | "custom" | "root" | string;
export type RulePhase = "ddos_l4" | "magic_transit" | "mt_managed" | "mt_ids_managed" | "http_request_sanitize" | "http_request_dynamic_redirect" | "http_request_transform" | "http_config_settings" | "http_request_origin" | "ddos_l7" | "http_request_api_gateway" | "http_request_firewall_custom" | "http_ratelimit" | "http_request_firewall_managed" | "http_request_sbfm" | "http_request_redirect" | "http_request_late_transform" | "http_request_cache_settings" | "http_request_snippets" | "http_request_cloud_connector" | "http_response_compression" | "http_response_firewall_managed" | "http_response_headers_transform" | (string & {});
export type Value = StaticValue | DynamicValue;
export type DynamicValue = {
    expression: string;
};
export type StaticValue = {
    value: string;
};
export type RewriteURIPart = Value;
/**
 * Header operation types for request header modifications.
 * Used in rewrite rules to define how headers should be manipulated.
 *
 * @example
 * // Remove a header
 * { operation: "remove" }
 *
 * @example
 * // Add or set a header with a static value
 * { operation: "add", value: "application/json" }
 * { operation: "set", value: "Bearer token123" }
 *
 * @example
 * // Add or set a header with a dynamic expression
 * { operation: "add", expression: "cf.ray_id" }
 * { operation: "set", expression: "concat(\"prefix-\", http.request.headers[\"x-custom\"][0])" }
 */
export type HeaderOperation = {
    operation: "remove";
} | {
    operation: "add" | "set";
    value: string;
} | {
    operation: "add" | "set";
    expression: string;
};
export interface UnknownActionRule extends RuleBase {
    action_parameters?: unknown;
}
export type Rule = BlockRule | ChallengeRule | JSChallengeRule | LogRule | ManagedChallengeRule | WafRedirectRule | RewriteRule | RouteRule | ScoreRule | ServeErrorRule | SetCacheSettingsRule | SetConfigRule | SkipRule | CompressResponseRule | ExecuteRule | DDoSDynamicRule | ForceConnectionCloseRule | LogCustomFieldRule;
export interface BlockRule extends RuleBase {
    action: "block";
    action_parameters?: {
        /** The response to show when the block is applied */
        response?: {
            /** The content to return (minLength: 1) */
            content?: string;
            /** The type of the content to return (minLength: 1) */
            content_type?: string;
            /** The status code to return (400..499) */
            status_code?: number;
        };
    };
}
export interface ChallengeRule extends UnknownActionRule {
    action: "challenge";
}
export interface JSChallengeRule extends UnknownActionRule {
    action: "js_challenge";
}
export interface LogRule extends UnknownActionRule {
    action: "log";
}
export interface ManagedChallengeRule extends UnknownActionRule {
    action: "managed_challenge";
}
export interface WafRedirectRule extends RuleBase {
    action: "redirect";
    action_parameters?: {
        /** Serve a redirect based on a bulk list lookup */
        from_list?: {
            /** Expression that evaluates to the list lookup key (minLength: 1) */
            key?: string;
            /** The name of the list to match against (maxLength: 50) */
            name?: string;
        };
        /** Serve a redirect based on the request properties */
        from_value?: {
            /** Keep the query string of the original request */
            preserve_query_string?: boolean;
            /** The status code to be used for the redirect */
            status_code?: 301 | 302 | 303 | 307 | 308;
            /** The URL to redirect the request to */
            target_url?: Value;
        };
    };
}
export interface RewriteRule extends RuleBase {
    action: "rewrite";
    action_parameters?: {
        /** Map of request headers to modify */
        headers?: Record<string, HeaderOperation>;
        /** URI to rewrite the request to */
        uri?: {
            /** Path portion rewrite */
            path?: RewriteURIPart;
            /** Query portion rewrite */
            query?: RewriteURIPart;
        };
    };
}
export interface RouteRule extends RuleBase {
    action: "route";
    action_parameters?: {
        /** Rewrite the HTTP Host header (minLength: 1) */
        host_header?: string;
        /** Override the IP/TCP destination */
        origin?: {
            /** Override the resolved hostname (minLength: 1) */
            host?: string;
            /** Override the destination port (1..65535) */
            port?: number;
        };
        /** Override the Server Name Indication (SNI) */
        sni?: {
            value: string;
        };
    };
}
export interface ScoreRule extends RuleBase {
    action: "score";
    action_parameters?: {
        /** Increment contains the delta to change the score and can be either positive or negative */
        increment?: number;
    };
}
export interface ServeErrorRule extends RuleBase {
    action: "serve_error";
    action_parameters?: {
        /** Error response content (maxLength: 10240, minLength: 1) */
        content?: string;
        /** Content-type header to set with the response */
        content_type?: "application/json" | "text/xml" | "text/plain" | "text/html";
        /** The status code to use for the error (400..999) */
        status_code?: number;
    };
}
export interface SetCacheSettingsRule extends RuleBase {
    action: "set_cache_settings";
    action_parameters?: {
        /** List of additional ports that caching can be enabled on */
        additional_cacheable_ports?: number[];
        /** Mark whether the request's response from origin is eligible for caching. Caching itself will still depend on the cache-control header and your other caching configurations */
        cache?: boolean;
        /** TTL (Time to Live) specifies the maximum time to cache a resource in the Cloudflare edge network */
        edge_ttl?: {
            /** Edge TTL options */
            mode: "respect_origin" | "override_origin" | "bypass_by_default";
            /** The TTL (in seconds) if you choose override_origin mode */
            default?: number;
            /** List of single status codes, or status code ranges to apply the selected mode */
            status_code_ttl?: {
                /** The range of status codes used to apply the selected mode */
                status_code_range?: {
                    /** Response status code lower bound */
                    from?: number;
                    /** Response status code upper bound */
                    to?: number;
                };
                /** Time to cache a response (in seconds). A value of 0 is equivalent to setting the Cache-Control header with the value "no-cache". A value of -1 is equivalent to setting Cache-Control header with the value of "no-store" */
                value: number;
                /** Set the TTL for responses with this specific status code */
                status_code_value?: number;
            }[];
        };
        /** Specify how long client browsers should cache the response. Cloudflare cache purge will not purge content cached on client browsers, so high browser TTLs may lead to stale content */
        browser_ttl?: {
            /** Determines which browser ttl mode to use */
            mode: "respect_origin" | "bypass_by_default" | "override_origin" | "bypass";
            /** The TTL (in seconds) if you choose override_origin mode */
            default?: number;
        };
        /** Define if Cloudflare should serve stale content while getting the latest content from the origin. If on, Cloudflare will not serve stale content while getting the latest content from the origin */
        serve_stale?: {
            /** Defines whether Cloudflare should serve stale content while updating. If true, Cloudflare will not serve stale content while getting the latest content from the origin */
            disable_stale_while_updating?: boolean;
        };
        /** Specify whether or not Cloudflare should respect strong ETag (entity tag) headers. When off, Cloudflare converts strong ETag headers to weak ETag headers */
        respect_strong_etags?: boolean;
        /** Define which components of the request are included or excluded from the cache key Cloudflare uses to store the response in cache */
        cache_key?: {
            /** Protect from web cache deception attacks while allowing static assets to be cached */
            cache_deception_armor?: boolean;
            /** Separate cached content based on the visitor's device type */
            cache_by_device_type?: boolean;
            custom_key?: {
                /** Use presence/absence of query parameters to build cache key */
                query_string?: {
                    include?: {
                        list?: string[];
                    } | {
                        all?: boolean;
                    };
                } | {
                    exclude?: {
                        list?: string[];
                    } | {
                        all?: boolean;
                    };
                };
                /** The header names and values to include in building the cache key */
                header?: {
                    /** Include these headers' names and their values */
                    include?: string[];
                    /** Checks for the presence of these header names. The presence of these headers is used in building the cache key */
                    check_presence?: string[];
                    /** Whether or not to include the origin header. A value of true will exclude the origin header in the cache key */
                    exclude_origin?: boolean;
                    /** For each header name and list of values combination, check if the request header contains any of the values provided. The presence of the request header and whether any of the values provided are contained in the request header value is used in building the cache key */
                    contains?: Record<string, string[]>;
                };
                /** The cookies to include in building the cache key */
                cookie?: {
                    /** Include these cookies' names and their values */
                    include?: string[];
                    /** Checks for the presence of these cookie names. The presence of these cookies is used in building the cache key */
                    check_presence?: string[];
                };
                /** Whether to use the original host or the resolved host in the cache key */
                host?: {
                    /** Use the resolved host in the cache key. A value of true will use the resolved host, while a value or false will use the original host */
                    resolved?: boolean;
                };
                /** Characteristics of the request user agent used in building the cache key */
                user?: {
                    /** Use the user agent's device type in the cache key */
                    device_type?: boolean;
                    /** Use the user agents's country in the cache key */
                    geo?: boolean;
                    /** Use the user agent's language in the cache key */
                    lang?: boolean;
                };
            };
        };
        /** Treat requests with the same query parameters the same, regardless of the order those query parameters are in. A value of true ignores the query strings' order */
        ignore_query_strings_order?: boolean;
        /** Mark whether the request's response from origin is eligible for Cache Reserve (requires a Cache Reserve add-on plan) */
        cache_reserve?: {
            /** Determines whether cache reserve is enabled. If this is true and a request meets eligibility criteria, Cloudflare will write the resource to cache reserve */
            eligible: boolean;
            /** The minimum file size eligible for store in cache reserve */
            minimum_file_size: number;
        };
        /** When enabled, Cloudflare will aim to strictly adhere to RFC 7234 */
        origin_cache_control?: boolean;
        /** Generate Cloudflare error pages from issues sent from the origin server. When on, error pages will trigger for issues from the origin */
        origin_error_page_passthru?: boolean;
        /** Define a timeout value between two successive read operations to your origin server. Historically, the timeout value between two read options from Cloudflare to an origin server is 100 seconds. If you are attempting to reduce HTTP 524 errors because of timeouts from an origin server, try increasing this timeout value */
        read_timeout?: number;
    };
}
export interface SetConfigRule extends RuleBase {
    action: "set_config";
    action_parameters?: {
        /** Select which file extensions to minify automatically */
        autominify?: {
            /** Minify CSS files */
            css?: boolean;
            /** Minify HTML files */
            html?: boolean;
            /** Minify JS files */
            js?: boolean;
        };
        /** Turn on or off Automatic HTTPS Rewrites */
        automatic_https_rewrites?: boolean;
        /** Turn on or off Browser Integrity Check */
        bic?: boolean;
        /** Turn off all active Cloudflare Apps */
        disable_apps?: true;
        /** Turn off Real User Monitoring (RUM) */
        disable_rum?: true;
        /** Turn off Zaraz */
        disable_zaraz?: true;
        /** Turn on or off the Hotlink Protection */
        hotlink_protection?: boolean;
        /** Turn on or off Email Obfuscation */
        email_obfuscation?: boolean;
        /** Turn on or off Cloudflare Fonts */
        fonts?: boolean;
        /** Turn on or off Mirage */
        mirage?: boolean;
        /** Turn on or off Opportunistic Encryption */
        opportunistic_encryption?: boolean;
        /** Configure the Polish level */
        polish?: "off" | "lossless" | "lossy" | "webp";
        /** Turn on or off Rocket Loader */
        rocket_loader?: boolean;
        /** Configure the Security Level */
        security_level?: "off" | "essentially_off" | "low" | "medium" | "high" | "under_attack";
        /** Turn on or off Server Side Excludes */
        server_side_excludes?: boolean;
        /** Configure the SSL level */
        ssl?: "off" | "flexible" | "full" | "strict" | "origin_pull";
        /** Turn on or off Signed Exchanges (SXG) */
        sxg?: boolean;
    };
}
export interface SkipRule extends RuleBase {
    action: "skip";
    action_parameters?: {
        /** A ruleset to skip the execution of. This option is incompatible with the rulesets option */
        ruleset?: "current";
        /** A phase to skip the execution of. This property is only compatible with products */
        phase?: "current";
        /** A list of phases to skip the execution of. This option is incompatible with the rulesets option */
        phases?: RulePhase[];
        /** A list of legacy security products to skip the execution of */
        products?: Array<"bic" | "hot" | "rateLimit" | "securityLevel" | "uaBlock" | "waf" | "zoneLockdown">;
        /** A mapping of ruleset IDs to a list of rule IDs in that ruleset to skip the execution of. This option is incompatible with the ruleset option */
        rules?: Record<string, string[]>;
        /** A list of ruleset IDs to skip the execution of. This option is incompatible with the ruleset and phases options */
        rulesets?: string[];
    };
}
export interface CompressResponseRule extends RuleBase {
    action: "compress_response";
    action_parameters?: {
        /** Custom order for compression algorithms */
        algorithms?: Array<{
            /** Name of compression algorithm to enable */
            name?: "none" | "auto" | "default" | "gzip" | "brotli" | "zstd";
        }>;
    };
}
export interface ExecuteRule extends RuleBase {
    action: "execute";
    action_parameters?: {
        /** The ID of the ruleset to execute */
        id: string;
        /** Optional version to execute (e.g. "latest") */
        version?: string;
        /** The configuration to use for matched data logging */
        matched_data?: {
            /** The public key to encrypt matched data logs with (minLength: 1) */
            public_key: string;
        };
        /** A set of overrides to apply to the target ruleset */
        overrides?: {
            /** An action to override all rules with. This option has lower precedence than rule and category overrides */
            action?: string;
            /** Whether to enable execution of all rules. This option has lower precedence than rule and category overrides */
            enabled?: boolean;
            /** A list of category-level overrides. This option has the second-highest precedence after rule-level overrides */
            categories?: Array<{
                /** The name of the category to override (minLength: 1) */
                category: string;
                /** The action to override rules in the category with */
                action?: string;
                /** Whether to enable execution of rules in the category */
                enabled?: boolean;
                /** The sensitivity level to use for rules in the category */
                sensitivity_level?: "default" | "medium" | "low" | "eoff";
            }>;
            /** A list of rule-level overrides. This option has the highest precedence */
            rules?: Array<{
                /** The ID of the rule to override */
                id: string;
                /** The action to override the rule with */
                action?: string;
                /** Whether to enable execution of the rule */
                enabled?: boolean;
                /** The score threshold to use for the rule */
                score_threshold?: number;
                /** The sensitivity level to use for the rule */
                sensitivity_level?: "default" | "medium" | "low" | "eoff";
            }>;
            /** A sensitivity level to set for all rules. This option has lower precedence than rule and category overrides and is only applicable for DDoS phases */
            sensitivity_level?: "default" | "medium" | "low" | "eoff";
        };
    };
}
export interface DDoSDynamicRule extends UnknownActionRule {
    action: "ddos_dynamic";
}
export interface ForceConnectionCloseRule extends UnknownActionRule {
    action: "force_connection_close";
}
export interface LogCustomFieldRule extends RuleBase {
    action: "log_custom_field";
    action_parameters?: {
        /** The raw request fields to log */
        request_fields?: BasicField[];
        /** The transformed request fields to log */
        transformed_request_fields?: BasicField[];
        /** The transformed response fields to log */
        response_fields?: ResponseField[];
        /** The raw response fields to log */
        raw_response_fields?: ResponseField[];
        /** The cookie fields to log */
        cookie_fields?: BasicField[];
    };
}
/**
 * Basic field definition for logging operations.
 * Contains the minimum required field name property.
 *
 * @example
 * { name: "user_id" }
 * { name: "request_method" }
 */
export interface BasicField {
    name: string;
}
/**
 * Response field definition for logging operations.
 * Extends BasicField with an optional flag to preserve duplicate header values.
 *
 * @example
 * // Basic response field
 * { name: "content_type" }
 *
 * @example
 * // Response field that preserves duplicate values
 * { name: "set_cookie", preserve_duplicates: true }
 */
export interface ResponseField extends BasicField {
    preserve_duplicates?: boolean;
}
export interface RuleBase {
    /** Human-readable description. */
    description?: string;
    /** Whether the rule executes (default true). */
    enabled?: boolean;
    /** WAF categories. */
    categories?: string[];
    /** Filtering expression (minLength 1). */
    expression?: string;
    /** Logging config. */
    logging?: {
        /** Whether to generate a log when the rule matches. */
        enabled: boolean;
    };
    /** Exposed credentials check config. */
    exposed_credential_check?: {
        password_expression: string;
        username_expression: string;
    };
    /** Rate limiting config. */
    ratelimit?: WafRateLimit;
    /** Stable reference for the rule (defaults to rule id). */
    ref?: string;
}
export interface WafRateLimit {
    /** Characteristics to count on (e.g. "ip.src"). */
    characteristics: string[];
    /** Period in seconds over which the counter is incremented. */
    period: number;
    /** Optional counting expression (defaults to the rule expression). */
    counting_expression?: string;
    /** Seconds after first execution to disable mitigation. */
    mitigation_timeout?: number;
    /** Threshold after which action triggers for the first time. */
    requests_per_period?: number;
    /** Count only when an origin is reached. */
    requests_to_origin?: boolean;
    /** Score threshold per period to trigger for the first time. */
    score_per_period?: number;
    /** Response header name carrying score to increment on. */
    score_response_header_name?: string;
}
//# sourceMappingURL=rule.d.ts.map