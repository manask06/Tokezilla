# Tokezilla

A modern Design Token Manager for creating, organizing, and exporting design tokens across multiple themes and platforms.

## Live Demo

- Production URL: pending deploy (run `vercel --prod`)
- Local dev: `http://localhost:5173`

## Demo Video

- 2-minute walkthrough: pending recording

## What It Does

Tokezilla lets you create, edit, organize, resolve, preview, import, and export design tokens across multiple themes.

### Core capabilities

- Color, spacing/dimension, and typography token CRUD
- Recursive alias support with circular reference detection
- Multi-theme workflow (create/rename/duplicate/delete/switch)
- Live component preview driven by generated CSS variables
- Multi-platform export:
  - CSS custom properties
  - Tailwind `theme.extend`
  - iOS Swift constants
  - Android `colors.xml` + `dimens.xml`
  - Nested W3C DTCG-style JSON
- JSON import with schema validation and preview
  - Supports Tokezilla app JSON and nested DTCG JSON
  - Import modes: merge or replace

## Tech Stack

- React 19
- TypeScript 5 (strict mode)
- Vite 7
- Tailwind CSS 4
- Zustand + persist middleware
- zod + react-hook-form
- shadcn/ui + Radix primitives
- react-hot-toast
- jszip

## Getting Started

### 1. Install

```bash
npm install
```

### 2. Run dev server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Lint and format

```bash
npm run lint
npm run format
```

## Import JSON Formats

### App format

```json
{
  "themes": [
    {
      "name": "Light",
      "isDefault": true,
      "tokens": [
        { "name": "colors.primary", "$type": "color", "$value": "#2563EB" }
      ]
    }
  ]
}
```

### DTCG-like nested format

```json
{
  "$metadata": { "theme": "Light" },
  "tokens": {
    "colors": {
      "primary": { "$type": "color", "$value": "#2563EB" }
    }
  }
}
```

## Export Output

Use Header -> Export to open Export Modal and generate files. Aliases are resolved before export.

## Accessibility and UX Notes

- Semantic layout (`header`, `main`, `section`, `aside`, `nav`)
- Keyboard-accessible modal and upload zone interactions
- ARIA labels on primary interactions
- Toast feedback for all critical actions
- Empty states, confirmations, and loading indicators included
- Responsive behavior for desktop/tablet/mobile

## Deployment

### Vercel CLI

```bash
npx vercel --prod
```

### GitHub integration

1. Push repository to GitHub
2. Import project in Vercel
3. Keep default Vite build settings

## Lighthouse

Run after deploy:

```bash
npx lighthouse <PRODUCTION_URL> --view
```

Target scores:

- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Why This Project

I built Tokezilla to demonstrate real frontend production skills in one cohesive app:

- type-safe UI architecture in React + TypeScript
- state modeling and persistence with Zustand
- schema-driven validation with zod
- practical design-token workflows used by modern product teams
- deployment readiness and export interoperability

