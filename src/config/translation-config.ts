/**
 * Translation configuration for content collections.
 * Defines which fields should be translated and which should be preserved.
 * This is used by the OpenAI translation script to ensure type-safe translation.
 */

export const TRANSLATION_CONFIG = {
  collections: {
    blog: {
      // Fields that should be translated (string content)
      translatableFields: ["title", "description"],
      // Fields that should be preserved exactly as-is
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
    },
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
    },
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
    },
  },
};

/**
 * Type guard to check if a field is translatable
 * @param {string} collection - Collection name
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isTranslatableField(collection, field) {
  const config = TRANSLATION_CONFIG.collections[collection];
  if (!config) return false;
  return config.translatableFields.includes(field);
}

/**
 * Type guard to check if a field should be preserved
 * @param {string} collection - Collection name
 * @param {string} field - Field name
 * @returns {boolean}
 */
export function isPreservedField(collection, field) {
  const config = TRANSLATION_CONFIG.collections[collection];
  if (!config) return false;
  return config.preservedFields.includes(field);
}

/**
 * Get nested translatable fields for a collection
 * @param {string} collection - Collection name
 * @returns {Record<string, string[]> | undefined}
 */
export function getNestedTranslatableFields(collection) {
  const config = TRANSLATION_CONFIG.collections[collection];
  return config?.nestedTranslatableFields;
}
