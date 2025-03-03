# Contributing to Zork Web

Thank you for your interest in contributing to Zork Web! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We strive to create a welcoming and inclusive community.

## Getting Started

### Prerequisites

- Node.js (v14.0.0+ recommended)
- npm or yarn
- Git

### Setting Up the Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zork-web.git
   cd zork-web
   ```
3. Install dependencies:
   ```bash
   npm run install-all
   ```
4. Start the development servers:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branching Strategy

- `main` branch is the stable, production-ready branch
- Feature branches should be created for new features
- Branch naming convention: `feature/feature-name` or `fix/issue-description`

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test them thoroughly

3. Commit your changes with a clear message:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

4. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request against the main repository's `main` branch

### Commit Messages

Write clear, concise commit messages that describe the purpose of the change:

- Use the imperative mood ("Add feature" not "Added feature")
- Start with a capital letter
- Keep the first line under 72 characters
- Reference issue numbers if applicable

Example:
```
Add command history navigation with arrow keys

- Implement up/down arrow history navigation
- Store command history in session
- Limit history to 50 commands

Fixes #123
```

## Pull Request Process

1. Ensure your code follows the project's coding standards
2. Update documentation if needed
3. Include tests for new functionality
4. Make sure all tests pass
5. Describe your changes in the Pull Request description
6. Reference any related issues

## Coding Standards

### JavaScript/React

- Use ES6+ features when appropriate
- Follow the existing code style
- Use functional components and hooks for React components
- Comment complex logic and public API functions

### CSS/Styling

- Use CSS modules for component styling
- Follow the BEM naming convention where applicable
- Ensure responsive design considerations

### Testing

- Write tests for new functionality
- Ensure existing tests pass
- Aim for good test coverage, especially for game logic

## Feature Requests and Bug Reports

If you'd like to suggest a new feature or report a bug:

1. Check existing issues to see if it's already been reported
2. Create a new issue with a clear title and description
3. For bugs, include steps to reproduce, expected behavior, and actual behavior
4. For features, describe the feature and its benefits

## Areas for Contribution

Here are some areas where contributions are especially welcome:

- Enhancing the terminal interface
- Expanding the game world and commands
- Improving accessibility
- Adding tests and documentation
- Performance optimizations

## Documentation

- Update README.md for user-facing changes
- Update DEVELOPER_GUIDE.md for technical implementation details
- Use JSDoc comments for functions and components

## Contact

If you have questions or need help, you can:

- Open an issue on GitHub
- Contact the maintainers via email

## License

By contributing to this project, you agree that your contributions will be licensed under the project's ISC license.