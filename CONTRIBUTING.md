# Contributing to build-kg-viewer

We welcome contributions of all kinds — bug fixes, new visualization components, documentation improvements, and more.

## Development Setup

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/build-kg-viewer.git
cd build-kg-viewer

# 2. Install dependencies
npm run setup

# 3. Start development servers
npm start
```

This starts:
- **Frontend** on http://localhost:3000 (React, hot-reload)
- **Backend** on http://localhost:3001 (Express)

## Code Style

- ESLint is configured in `frontend/.eslintrc.js`
- Run tests with `cd frontend && npm test`
- Backend tests: `cd backend && npm test`

## Pull Request Process

1. **Fork** the repository and create a branch from `main`
2. **Make your changes** with clear, focused commits
3. **Test** your changes locally
4. **Open a PR** against `main` with a clear description of what changed and why

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Include screenshots for UI changes
- Update the README if you add new features or configuration options

## Reporting Issues

- Use the [bug report template](https://github.com/agtm1199/build-kg-viewer/issues/new?template=bug_report.md) for bugs
- Use the [feature request template](https://github.com/agtm1199/build-kg-viewer/issues/new?template=feature_request.md) for ideas
- Check existing issues before opening a new one

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
