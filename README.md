# mcp-get

A command-line tool for installing and managing Model Context Protocol (MCP) servers.

## About Model Context Protocol

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Whether you're building an AI-powered IDE, enhancing a chat interface, or creating custom AI workflows, MCP provides a standardized way to connect LLMs with the context they need.

Learn more about MCP at [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction)

## What Packages Can You Install?

This tool helps you install and manage MCP servers that connect Claude to various data sources and tools, including:

- **Development Tools**: GitHub, GitLab
- **Communication Tools**: Slack
- **Search & Data**: Brave Search, Google Maps
- **Database Systems**: PostgreSQL
- **Web Automation**: Puppeteer
- **Cloud Storage**: Google Drive

## Prerequisites

- Node.js (version 14 or higher)
- Claude Desktop app (for local MCP server usage)

> **Note**: This tool has not been thoroughly tested on Windows systems yet. While it may work, you might encounter some issues. Contributions to improve Windows compatibility are welcome!


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
