const fs = require('fs');
const file = 'artifacts/sbg-army/src/lib/database.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `export type FeatureState = 'enabled' | 'hidden' | 'featured';
export interface FeatureConfig {
  state: FeatureState;
  placements: string[];
}
export interface SiteFeatures {
  sections: Record<string, FeatureConfig | boolean>;
  pages: Record<string, FeatureConfig | boolean>;
}

export function isFeatureActive(config: FeatureConfig | boolean | undefined): boolean {
  if (config === undefined) return true;
  if (typeof config === 'boolean') return config;
  return config.state !== 'hidden';
}

export function isFeatureState(config: FeatureConfig | boolean | undefined, state: FeatureState): boolean {
  if (config === undefined) return state === 'enabled';
  if (typeof config === 'boolean') return (config ? 'enabled' : 'hidden') === state;
  return config.state === state;
}

export function getFeaturePlacements(config: FeatureConfig | boolean | undefined): string[] {
  if (config === undefined || typeof config === 'boolean') return [];
  return config.placements || [];
}
`;

content = content.replace(/export interface SiteFeatures \{\n  sections: Record<string, boolean>;\n  pages: Record<string, boolean>;\n\}/, replacement);
fs.writeFileSync(file, content);
