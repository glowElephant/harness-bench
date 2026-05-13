import { homedir } from 'node:os';
import { join } from 'node:path';

const home = homedir();

export const PATHS = {
  claudeHome: join(home, '.claude'),
  settingsJson: join(home, '.claude', 'settings.json'),
  settingsLocalJson: join(home, '.claude', 'settings.local.json'),
  globalClaudeMd: join(home, '.claude', 'CLAUDE.md'),
  skillsDir: join(home, '.claude', 'skills'),
  agentsDir: join(home, '.claude', 'agents'),
  pluginsInstalledJson: join(home, '.claude', 'plugins', 'installed_plugins.json'),
  projectsDir: join(home, '.claude', 'projects'),
  claudeJson: join(home, '.claude.json'),
} as const;
