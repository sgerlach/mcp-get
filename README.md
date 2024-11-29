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

> **Note**: Currently, only NPX servers are supported. Pull requests are welcome to support Python servers.

## Usage Examples

### Install a Package

```
npx @michaellatman/mcp-get@latest install @modelcontextprotocol/server-brave-search
```

Sample output:
```
Installing @modelcontextprotocol/server-brave-search...
Installation complete.
```

### List Packages

```
npx @michaellatman/mcp-get@latest list
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
npx @michaellatman/mcp-get@latest uninstall @modelcontextprotocol/server-brave-search
```

Sample output:
```
Uninstalling @modelcontextprotocol/server-brave-search...
Uninstallation complete.
```

### Update the Tool

The tool automatically checks for updates when running commands. You can also manually update:

```
npx @michaellatman/mcp-get@latest update
```

Sample output:
```
Updating mcp-get...
Update complete.
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

## Adding Your Own MCP Server to the Registry

To add your own MCP server to the registry, follow these steps:

1. **Create Your MCP Server**: Develop your MCP server according to the MCP protocol specifications. Ensure it meets all the necessary requirements and functionalities.

2. **Prepare `package-list.json`**: Modify the existing `packages/package-list.json` file with the following required fields and format:
    ```json
    [
      {
        "name": "your-package-name",
        "description": "A brief description of your MCP server",
        "vendor": "Your Name or Organization",
        "sourceUrl": "URL to the source code repository",
        "homepage": "URL to the homepage or documentation",
        "license": "License type (e.g., MIT)"
      }
    ]
    ```

3. **Update the Registry**: Add your server details to the `packages/package-list.json` file in the repository. Ensure the details are accurate and follow the required format.

4. **Add to Helpers**: If your MCP server requires specific environment variables or configurations, add the necessary helper configurations to the `src/helpers/index.ts` file.

5. **Submit a Pull Request**: Fork the repository, make your changes, and submit a pull request with a clear description of your MCP server and its functionalities.

6. **Review and Merge**: The maintainers will review your pull request. If everything is in order, your MCP server will be added to the registry.

Once your changes are merged, they will automatically be published to NPM and available for users.
