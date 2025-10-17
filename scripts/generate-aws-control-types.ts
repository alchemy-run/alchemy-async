#!/usr/bin/env bun
import { $ } from "bun";
import { mkdir, writeFile } from "node:fs/promises";
// biome-ignore lint/style/noRestrictedImports: node:path in scripts is OK
import { dirname } from "node:path";
import prettier from "prettier";

const CFN_SPEC_URL =
  "https://d1uauaxba7bl26.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json";
const OUTPUT_FILE = "alchemy/src/aws/control/types.ts";
const PROPERTIES_FILE = "alchemy/src/aws/control/properties.ts";
const UPDATE_TYPES_FILE = "alchemy/src/aws/control/update-types.ts";

interface ResourceTypeProperty {
  Documentation?: string;
  Required?: boolean;
  Type: string;
  PrimitiveType?: string;
  PrimitiveItemType?: string;
  ItemType?: string;
  UpdateType?: string;
}

interface ResourceType {
  Documentation?: string;
  Properties: Record<string, ResourceTypeProperty>;
  Attributes?: Record<string, ResourceTypeProperty>;
}

interface PropertyType {
  Documentation?: string;
  Properties?: Record<string, ResourceTypeProperty>;
  Type?: string;
  PrimitiveType?: string;
  ItemType?: string;
  PrimitiveItemType?: string;
  UpdateType?: string;
  Required?: boolean;
}

interface CloudFormationSpec {
  ResourceTypes: Record<string, ResourceType>;
  PropertyTypes: Record<string, PropertyType>;
}

// Define custom type definitions that will be generated within service namespaces
const CUSTOM_TYPES: Record<string, Record<string, string>> = {
  IAM: {
    AssumeRolePolicyDocument: `{
  Version: "2012-10-17";
  Statement: Array<{
    Effect: "Allow" | "Deny";
    Principal: {
      Service?: string | string[];
      AWS?: string | string[];
      Federated?: string | string[];
      CanonicalUser?: string | string[];
    };
    Action: string | string[];
    Condition?: {
      [operator: string]: {
        [key: string]: string | string[];
      };
    };
    Sid?: string;
  }>;
}`,
  },
};

// Define manual type overrides (now just references to type names)
const TYPE_OVERRIDES: Record<string, Record<string, string>> = {
  IAM: {
    // Override for AssumeRolePolicyDocument which is typically "json" in CFN
    AssumeRolePolicyDocument: "AssumeRolePolicyDocument",
  },
};

function convertPropertyToTypeScript(prop: ResourceTypeProperty): string {
  // Handle primitive types
  if (prop.PrimitiveType) {
    let type = prop.PrimitiveType.toLowerCase();
    if (type === "integer" || type === "double") {
      type = "number";
    } else if (type === "json") {
      type = "any";
    } else if (type === "timestamp") {
      type = "string"; // timestamps are represented as ISO strings in CloudFormation
    } else if (type === "long") {
      type = "number"; // long integers are represented as numbers in TypeScript
    }
    return type;
  }
  // Handle array types
  else if (prop.Type === "List" || prop.Type === "Array") {
    if (prop.PrimitiveItemType) {
      let itemType = prop.PrimitiveItemType.toLowerCase();
      if (itemType === "integer" || itemType === "double") {
        itemType = "number";
      } else if (itemType === "json") {
        itemType = "any";
      }
      return `${itemType}[]`;
    } else if (prop.ItemType) {
      return `${sanitizeTypeName(prop.ItemType)}[]`;
    } else {
      return "any[]";
    }
  }
  // Handle map types
  else if (prop.Type === "Map") {
    return "Record<string, any>";
  }
  // Handle references to other types
  else if (prop.Type) {
    const sanitizedTypeName = sanitizeTypeName(prop.Type);
    // If the type name is empty or invalid after sanitization, fall back to any
    if (!sanitizedTypeName || sanitizedTypeName === "any") {
      return "any";
    }
    return sanitizedTypeName;
  }

  return "any";
}

function generatePropsInterface(
  resourceType: ResourceType,
  resourceName: string,
  serviceName: string,
): string {
  const lines: string[] = [];

  // Add interface documentation if available
  if (resourceType.Documentation) {
    lines.push(`/** ${resourceType.Documentation} */`);
  }

  lines.push(`interface ${resourceName}Props {`);

  // Add properties
  for (const [propName, prop] of Object.entries(resourceType.Properties)) {
    // Check if this property has a manual override
    const override = TYPE_OVERRIDES[serviceName]?.[propName];
    const propType = override || convertPropertyToTypeScript(prop);

    // Add documentation comment if available
    if (prop.Documentation) {
      lines.push(`  /** ${prop.Documentation} */`);
    }

    const required = prop.Required ? "" : "?";
    lines.push(`  ${propName}${required}: ${propType};`);
  }

  // Add the adopt property to all Props interfaces
  lines.push(
    "  /** If true, adopt existing resource instead of failing when resource already exists */",
  );
  lines.push("  adopt?: boolean;");

  lines.push("}");

  return lines.join("\n");
}

function generateReadOnlyPropertiesObject(
  resourceTypesByService: Record<string, Record<string, ResourceType>>,
): Record<string, Record<string, string[]>> {
  const properties: Record<string, Record<string, string[]>> = {};

  for (const [service, resources] of Object.entries(resourceTypesByService)) {
    for (const [resource, resourceType] of Object.entries(resources)) {
      const readOnlyProps: string[] = [];

      // Add all attributes (these are read-only outputs)
      if (resourceType.Attributes) {
        for (const attrName of Object.keys(resourceType.Attributes)) {
          readOnlyProps.push(attrName);
        }
      }

      // Check properties for read-only indicators
      for (const [propName, prop] of Object.entries(resourceType.Properties)) {
        // Properties with UpdateType "Immutable" are create-only (effectively read-only for updates)
        if (prop.UpdateType === "Immutable") {
          readOnlyProps.push(propName);
        }
      }

      // Only include if there are read-only properties
      if (readOnlyProps.length > 0) {
        if (!properties[service]) {
          properties[service] = {};
        }
        properties[service][resource] = readOnlyProps.sort(); // Sort for consistency
      }
    }
  }

  return properties;
}

function generateUpdateTypesObject(
  resourceTypesByService: Record<string, Record<string, ResourceType>>,
): Record<string, Record<string, Record<string, string>>> {
  const updateTypes: Record<
    string,
    Record<string, Record<string, string>>
  > = {};

  for (const [service, resources] of Object.entries(resourceTypesByService)) {
    for (const [resource, resourceType] of Object.entries(resources)) {
      const propertyUpdateTypes: Record<string, string> = {};

      // Map each property to its UpdateType
      for (const [propName, prop] of Object.entries(resourceType.Properties)) {
        if (prop.UpdateType) {
          propertyUpdateTypes[propName] = prop.UpdateType;
        }
      }

      // Only include if there are properties with UpdateType
      if (Object.keys(propertyUpdateTypes).length > 0) {
        if (!updateTypes[service]) {
          updateTypes[service] = {};
        }
        updateTypes[service][resource] = propertyUpdateTypes;
      }
    }
  }

  return updateTypes;
}

function generateResourceType(
  resourceType: ResourceType,
  resourceName: string,
  _serviceName: string,
): string {
  const lines: string[] = [];

  // Add type documentation if available
  if (resourceType.Documentation) {
    lines.push(`/** ${resourceType.Documentation} */`);
  }

  lines.push(`type ${resourceName} = ${resourceName}Props & {`);

  // Track which properties we've already added from attributes
  const addedProperties = new Set<string>();

  // Add attributes (output properties) from CloudFormation specification
  if (resourceType.Attributes) {
    for (const [propName, prop] of Object.entries(resourceType.Attributes)) {
      const propType = convertPropertyToTypeScript(prop);
      // Make all attributes required (remove ?) as requested
      // Since some attribute names contain a dot, make the attribute name a string literal.
      lines.push(`  "${propName}": ${propType};`);
      addedProperties.add(propName);
    }
  }

  lines.push("};");

  return lines.join("\n");
}

function sanitizeTypeName(typeName: string | undefined): string {
  // Handle undefined or non-string inputs
  if (!typeName || typeof typeName !== "string") {
    return "any";
  }

  // Fix common naming issues
  let fixedName = typeName;

  // Note: Don't fix plural forms automatically as they may be intentional type aliases
  // Individual fixes can be added if needed, but avoid blanket plural-to-singular conversion

  // Fix specific type name issues
  if (fixedName === "Tags") {
    fixedName = "Tag";
  }

  // Note: These types should exist in the spec and be processed appropriately

  // Replace dots with underscores and other invalid characters
  return fixedName
    .replace(/\./g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/^(\d)/, "_$1"); // Ensure it doesn't start with a number
}

function generateTypeAlias(
  propertyType: PropertyType,
  typeName: string,
): string {
  const sanitizedTypeName = sanitizeTypeName(typeName);
  let aliasType: string;

  if (propertyType.PrimitiveType) {
    aliasType = convertPropertyToTypeScript(
      propertyType as ResourceTypeProperty,
    );
  } else if (propertyType.Type === "List" || propertyType.Type === "Array") {
    if (propertyType.PrimitiveItemType) {
      let itemType = propertyType.PrimitiveItemType.toLowerCase();
      if (itemType === "integer" || itemType === "double") {
        itemType = "number";
      } else if (itemType === "json") {
        itemType = "any";
      } else if (itemType === "timestamp") {
        itemType = "string";
      } else if (itemType === "long") {
        itemType = "number";
      }
      aliasType = `${itemType}[]`;
    } else if (propertyType.ItemType) {
      aliasType = `${sanitizeTypeName(propertyType.ItemType)}[]`;
    } else {
      aliasType = "any[]";
    }
  } else if (propertyType.Type === "Map") {
    aliasType = "Record<string, any>";
  } else if (propertyType.Type) {
    aliasType = sanitizeTypeName(propertyType.Type);
  } else {
    aliasType = "any";
  }

  return `type ${sanitizedTypeName} = ${aliasType};`;
}

function generatePropertyTypeInterface(
  properties: Record<string, ResourceTypeProperty>,
  typeName: string,
): string {
  const lines: string[] = [];
  const sanitizedTypeName = sanitizeTypeName(typeName);

  lines.push(`interface ${sanitizedTypeName} {`);

  // Add properties
  for (const [propName, prop] of Object.entries(properties)) {
    // Add documentation comment if available
    if (prop.Documentation) {
      lines.push(`  /** ${prop.Documentation} */`);
    }

    const propType = convertPropertyToTypeScript(prop);
    const required = prop.Required ? "" : "?";
    lines.push(`  ${propName}${required}: ${propType};`);
  }

  lines.push("}");

  return lines.join("\n");
}

async function downloadSpec(): Promise<CloudFormationSpec> {
  console.log("Downloading CloudFormation specification...");
  const response = await fetch(CFN_SPEC_URL);

  if (!response.ok) {
    throw new Error(`Failed to download specification: ${response.statusText}`);
  }

  const spec = await response.json();

  console.log("Successfully downloaded specification");
  return spec;
}

async function generateTypes(spec: CloudFormationSpec): Promise<string> {
  console.log("Generating TypeScript types...");

  const declarations: string[] = [];
  declarations.push(`// Generated by scripts/generate-aws-control-types.ts
// DO NOT EDIT THIS FILE DIRECTLY

declare namespace AWS {`);

  // Generate global Tag type from spec if it exists
  if (spec.PropertyTypes.Tag) {
    const tagType = spec.PropertyTypes.Tag;
    if (tagType.Properties) {
      const tagInterface = generatePropertyTypeInterface(
        tagType.Properties,
        "Tag",
      );
      declarations.push(tagInterface);
    }
  }

  // Group property types by service for better organization
  const propertyTypesByService: Record<
    string,
    Record<string, PropertyType>
  > = {};

  for (const [fullTypeName, propertyType] of Object.entries(
    spec.PropertyTypes,
  )) {
    // Skip global types like "Tag" - these are handled separately
    if (!fullTypeName.includes("::")) {
      continue;
    }

    // fullTypeName is like "AWS::Cognito::UserPool.DeviceConfiguration" or "Alexa::ASK::Skill.SkillPackage"
    // We want to extract the service and type name
    let nameWithoutPrefix = fullTypeName;
    if (fullTypeName.startsWith("AWS::")) {
      nameWithoutPrefix = fullTypeName.replace("AWS::", "");
    }
    const parts = nameWithoutPrefix.split("::");

    if (parts.length >= 2) {
      const service = parts[0];
      // For property types, get everything after the first service part, then extract the type name after the dot
      const resourceAndType = parts.slice(1).join("::");
      const typeParts = resourceAndType.split(".");
      const typeName = typeParts[typeParts.length - 1]; // Get the last part after the dot

      if (!propertyTypesByService[service]) {
        propertyTypesByService[service] = {};
      }
      propertyTypesByService[service][typeName] = propertyType;
    }
  }

  // Group resource types by service
  const resourceTypesByService: Record<
    string,
    Record<string, ResourceType>
  > = {};

  for (const [typeName, cfnResourceType] of Object.entries(
    spec.ResourceTypes,
  )) {
    let nameWithoutPrefix = typeName;
    if (typeName.startsWith("AWS::")) {
      nameWithoutPrefix = typeName.replace("AWS::", "");
    }

    const parts = nameWithoutPrefix.split("::");
    if (parts.length >= 2) {
      const service = parts[0];
      const resource = parts.slice(1).join(""); // Join all parts without separator to create valid identifier

      if (!resourceTypesByService[service]) {
        resourceTypesByService[service] = {};
      }
      resourceTypesByService[service][resource] = cfnResourceType;
    }
  }

  // Process each service
  for (const service of Object.keys({
    ...propertyTypesByService,
    ...resourceTypesByService,
  })) {
    declarations.push(`  namespace ${service} {`);

    // Generate custom type definitions for this service
    if (CUSTOM_TYPES[service]) {
      for (const [typeName, typeDefinition] of Object.entries(
        CUSTOM_TYPES[service],
      )) {
        declarations.push(`    type ${typeName} = ${typeDefinition};
`);
      }
    }

    // Generate property type interfaces for this service
    if (propertyTypesByService[service]) {
      for (const [typeName, propertyType] of Object.entries(
        propertyTypesByService[service],
      )) {
        // Skip types that have manual overrides at the top level
        if (
          TYPE_OVERRIDES[service]?.[typeName] &&
          !TYPE_OVERRIDES[service][typeName].includes(".")
        ) {
          continue;
        }

        // Skip property types that conflict with resource types
        if (resourceTypesByService[service]?.[typeName]) {
          continue;
        }

        // Handle different property type structures
        if (propertyType.Properties) {
          // Complex type with properties
          const propertyInterface = generatePropertyTypeInterface(
            propertyType.Properties,
            typeName,
          );
          declarations.push(propertyInterface);
        } else if (propertyType.Type || propertyType.PrimitiveType) {
          // Simple type alias (like FilterGroup -> WebhookFilter[])
          const typeAlias = generateTypeAlias(propertyType, typeName);
          declarations.push(typeAlias);
        }
      }
    }

    // Generate resource types for this service
    if (resourceTypesByService[service]) {
      for (const [resource, cfnResourceType] of Object.entries(
        resourceTypesByService[service],
      )) {
        // Generate props interface
        const propsInterface = generatePropsInterface(
          cfnResourceType,
          resource,
          service,
        );
        declarations.push(propsInterface);

        // Generate resource type
        const resourceType = generateResourceType(
          cfnResourceType,
          resource,
          service,
        );
        declarations.push(resourceType);

        // Add function declaration
        declarations.push(
          `    function ${resource}(id: string, props: ${resource}Props): Promise<${resource}>;`,
        );
      }
    }

    declarations.push("  }"); // Close service namespace
  }

  declarations.push("}"); // Close AWS namespace
  declarations.push("\nexport = AWS;");

  // Format the generated code with Prettier
  const unformattedCode = declarations.join("\n");
  const formattedCode = await prettier.format(unformattedCode, {
    parser: "typescript",
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    printWidth: 100,
    tabWidth: 2,
    useTabs: true,
  });

  return formattedCode;
}

async function writeTypes(types: string): Promise<void> {
  console.log(`Writing types to ${OUTPUT_FILE}...`);
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, types);
  console.log("Successfully wrote type definitions");
}

async function writeProperties(
  properties: Record<string, Record<string, string[]>>,
): Promise<void> {
  console.log(`Writing properties to ${PROPERTIES_FILE}...`);
  await mkdir(dirname(PROPERTIES_FILE), { recursive: true });

  const content = `// Generated by scripts/generate-aws-control-types.ts
// DO NOT EDIT THIS FILE DIRECTLY

// Read-only properties for AWS resources
const properties = ${JSON.stringify(properties, null, 2)};

export default properties;
`;

  // Format the content with prettier
  const formattedContent = await prettier.format(content, {
    parser: "typescript",
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
  });

  await writeFile(PROPERTIES_FILE, formattedContent);
  console.log("Successfully wrote properties file");
}

async function writeUpdateTypes(
  updateTypes: Record<string, Record<string, Record<string, string>>>,
): Promise<void> {
  console.log(`Writing update types to ${UPDATE_TYPES_FILE}...`);
  await mkdir(dirname(UPDATE_TYPES_FILE), { recursive: true });

  const content = `// Generated by scripts/generate-aws-control-types.ts
// DO NOT EDIT THIS FILE DIRECTLY

// Update types for AWS resource properties
const updateTypes = ${JSON.stringify(updateTypes, null, 2)};

export default updateTypes;
`;

  // Format the content with prettier
  const formattedContent = await prettier.format(content, {
    parser: "typescript",
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
  });

  await writeFile(UPDATE_TYPES_FILE, formattedContent);
  console.log("Successfully wrote update types file");
}

async function runBiomeFix(): Promise<void> {
  console.log("Running biome fix on generated files...");

  try {
    await $`bunx @biomejs/biome check --write ${OUTPUT_FILE} ${PROPERTIES_FILE} ${UPDATE_TYPES_FILE}`;
    console.log("Successfully applied biome fixes to generated files");
  } catch (error) {
    console.warn("Warning: biome fix failed:", error);
    console.warn(
      "Generated files may not be properly formatted according to biome rules",
    );
  }
}

export async function generateAwsControlTypes(): Promise<{
  resourceTypesByService: Record<string, Record<string, ResourceType>>;
}> {
  const spec = await downloadSpec();
  await writeFile("aws-control-spec.json", JSON.stringify(spec, null, 2));
  const types = await generateTypes(spec);
  await writeTypes(types);

  // Generate read-only properties
  const resourceTypesByService: Record<
    string,
    Record<string, ResourceType>
  > = {};
  for (const [typeName, cfnResourceType] of Object.entries(
    spec.ResourceTypes,
  )) {
    let nameWithoutPrefix = typeName;
    if (typeName.startsWith("AWS::")) {
      nameWithoutPrefix = typeName.replace("AWS::", "");
    }

    const parts = nameWithoutPrefix.split("::");
    if (parts.length >= 2) {
      const service = parts[0];
      const resource = parts.slice(1).join(""); // Join all parts without separator to create valid identifier

      if (!resourceTypesByService[service]) {
        resourceTypesByService[service] = {};
      }
      resourceTypesByService[service][resource] = cfnResourceType;
    }
  }

  const properties = generateReadOnlyPropertiesObject(resourceTypesByService);
  await writeProperties(properties);

  const updateTypes = generateUpdateTypesObject(resourceTypesByService);
  await writeUpdateTypes(updateTypes);

  // Run biome fix on the generated files
  await runBiomeFix();

  // Emit metrics
  const totalServices = Object.keys(resourceTypesByService).length;
  const totalResources = Object.values(resourceTypesByService).reduce(
    (total, serviceResources) => total + Object.keys(serviceResources).length,
    0,
  );

  console.log("\n=== AWS Cloud Control API Coverage Metrics ===");
  console.log(`Total Services: ${totalServices}`);
  console.log(`Total Resources: ${totalResources}`);

  console.log(
    "\nSuccessfully generated AWS CloudFormation type definitions and properties",
  );

  return { resourceTypesByService };
}

// If this script is run directly, execute the generation
if (import.meta.main) {
  try {
    await generateAwsControlTypes();
  } catch (error) {
    console.error("Error generating type definitions:", error);
    process.exit(1);
  }
}
