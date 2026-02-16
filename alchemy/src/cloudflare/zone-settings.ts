/**
 * Common response fields for all settings
 */
export interface CloudflareSettingBase {
  /**
   * The identifier of the setting
   */
  id: string;

  /**
   * When the setting was last modified
   */
  modified_on: string | null;

  /**
   * Whether the setting can be modified
   */
  editable: boolean;
}

/**
 * Value types for each setting
 */
export type SSLValue = "off" | "flexible" | "full" | "strict";
export type MinTLSVersionValue = "1.0" | "1.1" | "1.2" | "1.3";
export type TLS13Value = "on" | "off" | "zrt";
export type CacheLevelValue = "aggressive" | "basic" | "simplified";

// Boolean setting values
export type AlwaysUseHTTPSValue = "on" | "off";
export type AutomaticHTTPSRewritesValue = "on" | "off";
export type BrotliValue = "on" | "off";
export type DevelopmentModeValue = "on" | "off";
export type EarlyHintsValue = "on" | "off";
export type EmailObfuscationValue = "on" | "off";
export type HotlinkProtectionValue = "on" | "off";
export type HTTP2Value = "on" | "off";
export type HTTP3Value = "on" | "off";
export type IPv6Value = "on" | "off";
export type WebSocketsValue = "on" | "off";
export type ZeroRTTValue = "on" | "off";

/**
 * Common response fields for boolean settings that use "on"/"off"
 */
export interface CloudflareBooleanSetting extends CloudflareSettingBase {
  /**
   * The value of the setting
   */
  value: "on" | "off";
}

/**
 * Advanced DDoS protection setting
 * @see https://developers.cloudflare.com/api/resources/zones/#advanced-ddos
 */
export interface AdvancedDDoSSetting extends CloudflareBooleanSetting {
  id: "advanced_ddos";
  value: "on" | "off";
}

/**
 * Always Online setting
 * When enabled, Cloudflare serves limited copies of web pages from the Internet Archive if your server is offline
 */
export interface AlwaysOnlineSetting extends CloudflareBooleanSetting {
  id: "always_online";
  value: "on" | "off";
}

/**
 * Always Use HTTPS setting
 * Redirects all HTTP traffic to HTTPS
 */
export interface AlwaysUseHTTPSSetting extends CloudflareSettingBase {
  id: "always_use_https";
  value: AlwaysUseHTTPSValue;
}

/**
 * Automatic HTTPS Rewrites setting
 * Automatically rewrites HTTP URLs to HTTPS
 */
export interface AutomaticHTTPSRewritesSetting extends CloudflareSettingBase {
  id: "automatic_https_rewrites";
  value: AutomaticHTTPSRewritesValue;
}

/**
 * Automatic Platform Optimization setting
 */
export interface AutomaticPlatformOptimizationSetting extends CloudflareSettingBase {
  id: "automatic_platform_optimization";
  value: {
    enabled: boolean;
    cf: boolean;
    wordpress: boolean;
    wordpress_plugin: boolean;
    cache_by_device_type: boolean;
  };
}

/**
 * Brotli compression setting
 */
export interface BrotliSetting extends CloudflareSettingBase {
  id: "brotli";
  value: BrotliValue;
}

/**
 * Browser Cache TTL setting
 */
export interface BrowserCacheTTLSetting extends CloudflareSettingBase {
  id: "browser_cache_ttl";
  value: number;
}

/**
 * Browser Check setting
 */
export interface BrowserCheckSetting extends CloudflareSettingBase {
  id: "browser_check";
  value: "on" | "off";
}

/**
 * Cache Level setting
 */
export interface CacheLevelSetting extends CloudflareSettingBase {
  id: "cache_level";
  value: CacheLevelValue;
}

/**
 * Challenge TTL setting
 */
export interface ChallengeTTLSetting extends CloudflareSettingBase {
  id: "challenge_ttl";
  value: number;
}

/**
 * Ciphers setting
 */
export interface CiphersSetting extends CloudflareSettingBase {
  id: "ciphers";
  value: string[];
}

/**
 * Development Mode setting
 */
export interface DevelopmentModeSetting extends CloudflareSettingBase {
  id: "development_mode";
  value: DevelopmentModeValue;
}

/**
 * Early Hints setting
 */
export interface EarlyHintsSetting extends CloudflareSettingBase {
  id: "early_hints";
  value: EarlyHintsValue;
}

/**
 * Email Obfuscation setting
 */
export interface EmailObfuscationSetting extends CloudflareSettingBase {
  id: "email_obfuscation";
  value: EmailObfuscationValue;
}

/**
 * Hotlink Protection setting
 */
export interface HotlinkProtectionSetting extends CloudflareSettingBase {
  id: "hotlink_protection";
  value: HotlinkProtectionValue;
}

/**
 * HTTP/2 setting
 */
export interface HTTP2Setting extends CloudflareSettingBase {
  id: "http2";
  value: HTTP2Value;
}

/**
 * HTTP/3 setting
 */
export interface HTTP3Setting extends CloudflareSettingBase {
  id: "http3";
  value: HTTP3Value;
}

/**
 * IP Geolocation setting
 */
export interface IPGeolocationSetting extends CloudflareSettingBase {
  id: "ip_geolocation";
  value: "on" | "off";
}

/**
 * IPv6 setting
 */
export interface IPv6Setting extends CloudflareSettingBase {
  id: "ipv6";
  value: IPv6Value;
}

/**
 * Minimum TLS Version setting
 */
export interface MinTLSVersionSetting extends CloudflareSettingBase {
  id: "min_tls_version";
  value: MinTLSVersionValue;
}

/**
 * Opportunistic Encryption setting
 */
export interface OpportunisticEncryptionSetting extends CloudflareSettingBase {
  id: "opportunistic_encryption";
  value: "on" | "off";
}

/**
 * SSL setting
 */
export interface SSLSetting extends CloudflareSettingBase {
  id: "ssl";
  value: SSLValue;
  certificate_status?: string;
  validation_errors?: Array<{
    message: string;
  }>;
}

/**
 * TLS 1.3 setting
 */
export interface TLS13Setting extends CloudflareSettingBase {
  id: "tls_1_3";
  value: TLS13Value;
}

/**
 * WebSockets setting
 */
export interface WebSocketsSetting extends CloudflareSettingBase {
  id: "websockets";
  value: WebSocketsValue;
}

/**
 * Zero-RTT setting
 */
export interface ZeroRTTSetting extends CloudflareSettingBase {
  id: "0rtt";
  value: ZeroRTTValue;
}

/**
 * All possible zone settings
 */
export type CloudflareZoneSetting =
  | AdvancedDDoSSetting
  | AlwaysOnlineSetting
  | AlwaysUseHTTPSSetting
  | AutomaticHTTPSRewritesSetting
  | AutomaticPlatformOptimizationSetting
  | BrotliSetting
  | BrowserCacheTTLSetting
  | BrowserCheckSetting
  | CacheLevelSetting
  | ChallengeTTLSetting
  | CiphersSetting
  | DevelopmentModeSetting
  | EarlyHintsSetting
  | EmailObfuscationSetting
  | HotlinkProtectionSetting
  | HTTP2Setting
  | HTTP3Setting
  | IPGeolocationSetting
  | IPv6Setting
  | MinTLSVersionSetting
  | OpportunisticEncryptionSetting
  | SSLSetting
  | TLS13Setting
  | WebSocketsSetting
  | ZeroRTTSetting;

/**
 * Input for updating a zone setting
 */
export interface UpdateZoneSettingParams {
  /**
   * The value to set
   */
  value: CloudflareZoneSetting["value"];
}

/**
 * Response for zone settings operations
 */
export interface CloudflareZoneSettingResponse {
  /**
   * Whether the API call was successful
   */
  success: boolean;

  /**
   * Any error messages
   */
  errors: Array<{
    code: number;
    message: string;
  }>;

  /**
   * Any informational messages
   */
  messages: Array<{
    code: number;
    message: string;
  }>;

  /**
   * The settings that were operated on
   */
  result: CloudflareZoneSetting[];
}

/**
 * Response for a single zone setting operation
 */
export interface CloudflareZoneSettingSingleResponse {
  /**
   * Whether the API call was successful
   */
  success: boolean;

  /**
   * Any error messages
   */
  errors: Array<{
    code: number;
    message: string;
  }>;

  /**
   * Any informational messages
   */
  messages: Array<{
    code: number;
    message: string;
  }>;

  /**
   * The setting that was operated on
   */
  result: CloudflareZoneSetting;
}
