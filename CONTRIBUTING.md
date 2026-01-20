# Contributing to DevInsight

Thank you for your interest in contributing to DevInsight! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/devinsight/devinsight.git
   cd devinsight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
devinsight/
├── src/
│   ├── core/           # Core components
│   ├── features/       # Feature modules
│   ├── utils/          # Utility functions
│   └── types/          # TypeScript types
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── examples/           # Example applications
└── docs/              # Documentation
```

## Code Style

- Use TypeScript for all source code
- Follow ESLint and Prettier configurations
- Write meaningful comments for complex logic
- Maintain test coverage above 80%

## Testing

- Write unit tests for all new features
- Add integration tests for complex workflows
- Run `npm test` before submitting PR
- Check coverage with `npm run test -- --coverage`

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## Code of Conduct

Be respectful and professional in all interactions.
