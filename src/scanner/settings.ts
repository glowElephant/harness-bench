import { readJsonSafe } from './io.js';
import { PATHS } from './paths.js';

interface SettingsShape {
  hooks?: Record<string, Array<{ matcher?: string; hooks?: Array<unknown> }>>;
  enabledPlugins?: Record<string, boolean>;
}

export async function scanSettings(): Promise<{
  hooks: number;
  hookKinds: string[];
  enabledPlugins: number;
}> {
  const main = (await readJsonSafe<SettingsShape>(PATHS.settingsJson)) ?? {};
  const local = (await readJsonSafe<SettingsShape>(PATHS.settingsLocalJson)) ?? {};

  const hookKinds = new Set<string>();
  let hooks = 0;

  for (const settings of [main, local]) {
    const hookGroups = settings.hooks ?? {};
    for (const [event, groups] of Object.entries(hookGroups)) {
      if (!Array.isArray(groups)) continue;
      for (const group of groups) {
        const inner = Array.isArray(group?.hooks) ? group.hooks.length : 0;
        if (inner > 0) {
          hookKinds.add(event);
          hooks += inner;
        }
      }
    }
  }

  const plugins = Object.entries(main.enabledPlugins ?? {})
    .filter(([, enabled]) => enabled).length;

  return {
    hooks,
    hookKinds: Array.from(hookKinds).sort(),
    enabledPlugins: plugins,
  };
}
