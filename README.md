# mcp-install

## Project Description

`mcp-get` is a command-line tool that allows you to install, list, and uninstall packages. It provides a convenient way to manage packages for your project.

## Prerequisites

- Node.js (version 14 or higher)

## Usage Examples

### Install a Package

```
npx @michaellatman/mcp-get install @modelcontextprotocol/server-brave-search
```

Sample output:
```
Installing @modelcontextprotocol/server-brave-search...
Installation complete.
```

### List Packages

```
npx @michaellatman/mcp-get list
```

Sample output:
```
📦 Available Packages
Found 11 packages

@modelcontextprotocol/server-brave-search │ MCP server for Brave Search API integration │ Anthropic, PBC (https://anthropic.com) │ MIT
@modelcontextprotocol/server-everything   │ MCP server that exercises all the features of the MCP protocol │ Anthropic, PBC (https://anthropic.com) │ MIT
...
```

### Uninstall a Package

```
npx @michaellatman/mcp-get uninstall @modelcontextprotocol/server-brave-search
```

Sample output:
```
Uninstalling @modelcontextprotocol/server-brave-search...
Uninstallation complete.
```

## Contributing

We welcome contributions to the project! If you would like to contribute, please follow these guidelines:

1. Fork the repository and create a new branch for your feature or bugfix.
2. Write tests for your changes and ensure all existing tests pass.
3. Submit a pull request with a clear description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact Information

If you have any questions or need help, feel free to reach out:

- GitHub Issues: [michaellatman/mcp-get](https://github.com/michaellatman/mcp-get/issues)
