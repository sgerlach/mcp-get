import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface MCPServerConfig {
  command: string;
  args: string[];
}

interface ClaudeConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  [key: string]: any;
}

export function getConfigPath(): string {
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

export function installMCPServer(packageName: string): void {
  const config = readConfig();
  const serverName = packageName;
  
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  config.mcpServers[serverName] = {
    command: 'npx',
    args: ['-y', packageName]
  };
  
  writeConfig(config);
} 