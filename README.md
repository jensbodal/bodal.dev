# Bodal.dev

Personal website and blog built with Next.js and deployed to GitHub Pages.

## Features

- 🚀 Static site generation with Next.js App Router
- 📝 MDX support for rich blog content
- 🎨 Light/dark theme with system preference detection
- ♿ Accessible and semantic HTML
- 📱 Fully responsive design
- 🔧 GitHub Pages deployment via GitHub Actions

## Prerequisites

- Bun 1.0+ (or Node.js 18+ with npm)
- Git

## Local Development

### Setup

```bash
# Clone the repository
git clone https://github.com/jensbodal/bodal.dev.git
cd bodal.dev

# Install dependencies
bun install
```

### Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Run type checking
bun run typecheck

# Run linting
bun run lint
```

The development server runs at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
bodal.dev/
├── app/              # Next.js App Router pages
│   ├── about/        # About page
│   ├── blog/         # Blog listing page
│   ├── contact/      # Contact page
│   ├── projects/     # Projects page
│   └── layout.tsx    # Root layout with navigation
├── content/          # Markdown/MDX content
│   └── blog/         # Blog posts
├── lib/              # Utility functions
│   └── blog.ts       # Blog post utilities
├── public/           # Static assets
│   └── CNAME         # GitHub Pages custom domain
└── .github/          
    └── workflows/    # GitHub Actions deployment
```

## Content Management

### Writing Blog Posts

1. Create a new markdown file in `content/blog/`
2. Add frontmatter with required fields:

```markdown
---
title: Your Post Title
date: 2024-08-02
excerpt: A brief description of your post
---

Your content here...
```

3. The post will automatically appear in the blog listing

### Supported Content

- Markdown (.md) files
- MDX (.mdx) files for interactive content
- Code syntax highlighting
- Images and media

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

```bash
# Build the static site
bun run build

# The output will be in the 'out' directory
```

### GitHub Pages Setup

1. Ensure GitHub Pages is enabled in your repository settings
2. Set source to "GitHub Actions"
3. The custom domain is configured via `public/CNAME`

## Customization

### Theming

Edit CSS variables in `app/globals.css`:
- Light theme: `:root`
- Dark theme: `@media (prefers-color-scheme: dark)`

### Navigation

Update the navigation in `app/layout.tsx`

### Metadata

Site metadata is configured in `app/layout.tsx`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

This project is open source and available under the MIT License.# Test Bun Workflow
