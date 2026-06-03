/**
 * Translation configuration for content collections.
 * Defines which fields should be translated and which should be preserved.
 * This is used by the OpenAI translation script to ensure type-safe translation.
 */

import { TRANSLATION_SOURCE, TRANSLATION_TARGETS } from "./languages";

interface CollectionConfig {
  translatableFields: string[];
  preservedFields: string[];
  nestedTranslatableFields?: Record<string, string[]>;
}

export const TRANSLATION_CONFIG = {
  sourceLang: TRANSLATION_SOURCE,
  targetLangs: TRANSLATION_TARGETS,
  collections: {
    blog: {
      translatableFields: ["title", "description"],
      preservedFields: [
        "pubDate",
        "updatedDate",
        "lang",
        "coverImage",
        "ogImage",
        "tags",
        "draft",
        "status",
        "order",
        "techStack",
        "duration",
        "teamSize",
        "role",
        "url",
        "sourceUrl",
        "blogUrl",
      ],
    } as CollectionConfig,
    projects: {
      translatableFields: ["title", "description", "duration", "role"],
      preservedFields: [
        "pubDate",
        "updatedDate",
        "lang",
        "coverImage",
        "ogImage",
        "tags",
        "draft",
        "status",
        "order",
        "techStack",
        "teamSize",
        "url",
        "sourceUrl",
        "blogUrl",
      ],
    } as CollectionConfig,
    developers: {
      translatableFields: ["name", "role", "bio"],
      nestedTranslatableFields: {
        certifications: ["name", "issuer"],
        education: ["institution", "department", "status"],
      },
      preservedFields: [
        "pubDate",
        "updatedDate",
        "lang",
        "coverImage",
        "ogImage",
        "tags",
        "draft",
        "avatar",
        "github",
        "email",
        "website",
        "techStack",
        "date",
        "period",
        "badge",
        "url",
      ],
    } as CollectionConfig,
  },
};

/**
 * Type guard to check if a field is translatable
 * @param {string} collection - Collection name
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isTranslatableField(
  collection: string,
  field: string,
): boolean {
  const config =
    TRANSLATION_CONFIG.collections[
      collection as keyof typeof TRANSLATION_CONFIG.collections
    ];
  if (!config) return false;
  return config.translatableFields.includes(field);
}

/**
 * Type guard to check if a field should be preserved
 * @param {string} collection - Collection name
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isPreservedField(collection: string, field: string): boolean {
  const config =
    TRANSLATION_CONFIG.collections[
      collection as keyof typeof TRANSLATION_CONFIG.collections
    ];
  if (!config) return false;
  return config.preservedFields.includes(field);
}

/**
 * Get nested translatable fields for a collection
 * @param {string} collection - Collection name
 * @returns {Record<string, string[]> | undefined}
 */
export function getNestedTranslatableFields(
  collection: string,
): Record<string, string[]> | undefined {
  const config =
    TRANSLATION_CONFIG.collections[
      collection as keyof typeof TRANSLATION_CONFIG.collections
    ];
  return config?.nestedTranslatableFields;
}
