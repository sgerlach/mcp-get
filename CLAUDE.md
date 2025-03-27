# CLAUDE.md for mcp-get

## Build/Lint/Test Commands
- Build: `npm run build`
- Test all: `npm test`
- Test single file: `npm run test:file src/__tests__/file.test.ts`
- Test with watch: `npm run test:watch`
- Test coverage: `npm run test:coverage` 
- PR check: `npm run pr-check`
- Registry convert: `npm run registry:convert`
- Add package to registry: `npm run registry:add <package-file.json>`

## Code Style Guidelines
- **Module System**: ES Modules with `.js` extension in imports
- **Formatting**: 2-space indentation, semicolons, single quotes
- **Naming**: camelCase for functions/variables, PascalCase for interfaces/classes, kebab-case for files
- **Types**: Explicit typing for functions, parameters, and returns; interfaces in dedicated files
- **Error Handling**: Use try/catch blocks with appropriate console.error messages and error propagation
- **Testing**: Jest with mocks for external dependencies; test files in `__tests__` directories with `.test.ts` extension
- **Imports**: Group by external packages first, then internal modules
- **Async**: Use async/await pattern for asynchronous code
- **CLI Commands**: Follow command pattern with consistent structure in `commands/` directory
- **Configuration**: Use `ConfigManager` for managing persistent configurations

## Testing Guidelines
- Use proper TypeScript interfaces for mocks (with mockReturnValueOnce, mockResolvedValueOnce, etc.)
- When testing CLI commands, mock all dependencies including inquirer, chalk, and utils
- Use `as unknown as MockType` pattern for properly typing Jest mocks
- For interactive CLI testing, mock the inquirer.prompt response values

## Package Registry Structure
- Packages are stored as individual JSON files in the `packages/` directory
- Each file follows the naming convention: `packageName.json` (scoped packages use `scope--name.json`)
- Package files contain metadata and environment variables
- To add a new package:
  1. Create a JSON file with the package metadata
  2. Use `npm run registry:add <package-file.json>` to validate and add it to the registry
- Environment variables should be included in the package file under the `environmentVariables` key
- The system will automatically find all packages by scanning the directory