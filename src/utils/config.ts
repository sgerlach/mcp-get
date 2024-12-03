import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
  runtime?: 'node' | 'python';
}

export interface ClaudeConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: any;
}

function getPackageRuntime(packageName: string): 'node' | 'python' {
  const packageListPath = path.join(dirname(__dirname), '../packages/package-list.json');
  if (!fs.existsSync(packageListPath)) {
    return 'node'; // Default to node if package list doesn't exist
  }

  const packageList = JSON.parse(fs.readFileSync(packageListPath, 'utf8'));
  const pkg = packageList.find((p: any) => p.name === packageName);
  return pkg?.runtime || 'node';
}

export function getConfigPath(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  }

  const configDir = path.join(os.homedir(), 'Library', 'Application Support', 'Claude');
  return path.join(configDir, 'claude_desktop_config.json');
}

export function readConfig(): ClaudeConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function writeConfig(config: ClaudeConfig): void {
  const configPath = getConfigPath();
  const configDir = path.dirname(configPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function installMCPServer(packageName: string, envVars?: Record<string, string>, runtime?: 'node' | 'python'): void {
  const config = readConfig();
  const serverName = packageName.replace(/\//g, '-');
  
  const effectiveRuntime = runtime || getPackageRuntime(packageName);
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  const serverConfig: MCPServerConfig = {
    runtime: effectiveRuntime,
    env: envVars,
    command: effectiveRuntime === 'python' ? 'uvx' : 'npx',
    args: effectiveRuntime === 'python' ? [packageName] : ['-y', packageName]
  };
  
  config.mcpServers[serverName] = serverConfig;
  writeConfig(config);
}

export function envVarsToArgs(envVars: Record<string, string>): string[] {
  return Object.entries(envVars).map(([key, value]) => {
    const argName = key.toLowerCase().replace(/_/g, '-');
    return [`--${argName}`, value];
  }).flat();
} 