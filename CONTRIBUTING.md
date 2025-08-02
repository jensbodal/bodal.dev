# Contributing to Bodal.dev

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Development Workflow

### Branch Naming Conventions

When using AI-assisted development tools, use these prefixes:
- `claude/` - Claude Code branches (e.g., `claude/add-feature`)
- `codexc/` - OpenAI Codex CLI branches
- `codexw/` - Codex Web branches
- `aider/` - Aider branches
- `main` - Production branch (protected)

### Setting Up Development

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/bodal.dev.git
   cd bodal.dev
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b claude/your-feature-name
   ```

### Development Commands

```bash
# Start development server
npm run dev

# Type checking (must pass before committing)
npm run typecheck

# Linting
npm run lint

# Build for production
npm run build
```

## Code Style

- TypeScript strict mode is enforced
- Follow existing code patterns and conventions
- Use semantic HTML for accessibility
- Ensure responsive design works on all devices

## Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commits format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `style:` for formatting changes
  - `refactor:` for code refactoring
  - `test:` for adding tests
  - `chore:` for maintenance tasks

Example:
```
feat: add dark mode toggle to navigation
fix: correct blog post sorting order
docs: update README with deployment instructions
```

## Pull Request Process

1. Ensure all tests pass and code type checks
2. Update documentation if needed
3. Fill out the PR template completely
4. Link any related issues
5. Wait for code review

### PR Title Format
- Use the same conventional commit format as commits
- Be descriptive but concise

## Content Contributions

### Blog Posts

1. Create a new file in `content/blog/` with kebab-case naming
2. Include all required frontmatter fields
3. Use proper markdown formatting
4. Test locally before submitting

### Code Quality Checklist

Before submitting a PR, ensure:
- [ ] Code passes `npm run typecheck`
- [ ] Code passes `npm run lint`
- [ ] Site builds successfully with `npm run build`
- [ ] All links work correctly
- [ ] Images have alt text
- [ ] New features work in both light and dark themes
- [ ] Changes are responsive on mobile devices

## Testing

Run these commands before submitting:
```bash
npm run typecheck
npm run lint
npm run build
```

## Getting Help

- Open an issue for bugs or feature requests
- Use discussions for questions
- Tag maintainers for urgent issues

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Follow the project's goals and vision

Thank you for contributing!