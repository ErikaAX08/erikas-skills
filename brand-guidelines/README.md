---
name: brand-guidelines
description: Applies brand colors and typography to any artifact requiring visual styling. Use it when brand colors, style guidelines, visual formatting, or design standards apply. Works with any brand palette, not just Anthropic's.
license: Complete terms in LICENSE.txt
---

# Brand Styling Skill

## Overview

This skill applies brand-specific colors and typography to any artifact that may benefit from having a consistent visual identity. It is designed to work with **any brand palette**, not a single predefined one.

**Keywords**: branding, corporate identity, visual identity, post-processing, styling, brand colors, typography, visual formatting, visual design, color palette, design system

## Critical Rule: Prefer UI Library Components Over New Ones

**Whenever a new component is needed, first check whether the project is using a UI
library** (e.g.: shadcn/ui, Material UI, Chakra UI, Radix, Ant Design, PrimeVue,
Vuetify, etc.). Look for telltale signs such as `components.json`, a `components/ui/`
folder, or the library listed in `package.json`.

- **If a UI library is in use, use its components exclusively** instead of building new
  ones from scratch. Compose, extend, and theme the library's components rather than
  reinventing buttons, inputs, dialogs, tables, etc.
- Only create a brand-new custom component when the required UI **does not exist** in
  the library, and even then build it on top of the library's primitives and tokens
  when possible.
- Apply the brand palette and typography **through the library's theming mechanism**
  (CSS variables, theme provider, tokens) so styling stays consistent with the library.
- Never duplicate a component the library already provides.

## Critical Rule: Always Ask for the Color Palette First

**Before applying any styling, this skill MUST ask the user for their specific brand palette and typography preferences.**

Never assume or use a default palette without explicit confirmation. If the user does not provide one, prompt them with the following questions.

## Required Information to Collect

When this skill is invoked, gather the following information from the user:

### 1. Color Palette

Ask the user to provide their brand colors in the following categories:

```
Please provide your brand color palette:

**Main Colors:**
- Dark (primary text and dark backgrounds): [color/hex]
- Light (light backgrounds and text on dark): [color/hex]
- Mid Gray (secondary elements): [color/hex]
- Light Gray (subtle backgrounds): [color/hex]

**Accent Colors:**
- Primary accent: [color/hex]
- Secondary accent: [color/hex]
- Tertiary accent: [color/hex]

**Optional Extended Palette:**
- Success/Positive: [color/hex]
- Warning/Caution: [color/hex]
- Error/Negative: [color/hex]
- Info/Neutral: [color/hex]
```

### 2. Typography

```
Please provide your brand typography preferences:

- Heading font: [font name]
- Heading fallback: [font name]
- Body font: [font name]
- Body fallback: [font name]
- Code font (optional): [font name]
```

### 3. Usage Context

```
What type of artifact are you styling?

- Presentation/Slide Deck
- Document/Report
- Web Interface
- Mobile App Interface
- Dashboard/Data Visualization
- Email Template
- Social Media Graphic
- Other: [specify]
```

## How to Prompt the User

When the skill is invoked without a palette, respond with:

```
I'll help you apply brand styling. To get started, I need your brand guidelines.

You can provide them in any of these ways:

1. **Paste a complete palette** (easiest):
   "Primary: #1a73e8, Secondary: #ea4335, Background: #ffffff, Text: #202124, Fonts: Inter for headings, Roboto for body"

2. **Describe your brand**:
   "I want to use Material Design colors with the Inter font family"

3. **Use a well-known palette**:
   "Use shadcn/ui default theme" or "Use Tailwind's default color palette"

4. **Provide a reference**:
   "Use the colors from our website: [URL]"

What would work best for you?
```

## Standard Palette Template

Once the user provides their colors, organize them into this structure:

```markdown
## Active Brand Palette

### Main Colors

| Role       | Color   | Hex   |
| ---------- | ------- | ----- |
| Dark       | [color] | [hex] |
| Light      | [color] | [hex] |
| Mid Gray   | [color] | [hex] |
| Light Gray | [color] | [hex] |

### Accent Colors

| Role             | Color   | Hex   |
| ---------------- | ------- | ----- |
| Primary Accent   | [color] | [hex] |
| Secondary Accent | [color] | [hex] |
| Tertiary Accent  | [color] | [hex] |

### Semantic Colors (if provided)

| Role    | Color   | Hex   |
| ------- | ------- | ----- |
| Success | [color] | [hex] |
| Warning | [color] | [hex] |
| Error   | [color] | [hex] |
| Info    | [color] | [hex] |

### Typography

| Role     | Font   | Fallback   |
| -------- | ------ | ---------- |
| Headings | [font] | [fallback] |
| Body     | [font] | [fallback] |
| Code     | [font] | [fallback] |
```

## Built-in Palette Presets

If the user requests a well-known palette, apply these presets:

### shadcn/ui Default Theme

The default shadcn/ui theme uses CSS variables that map to Tailwind CSS colors with a neutral gray scale. This theme is designed for the New York style.

**CSS Variables:**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}
```

**Dark Mode CSS Variables:**

```css
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

**Standardized Palette for shadcn/ui Default:**

| Role                   | Light Mode                | Dark Mode                 |
| ---------------------- | ------------------------- | ------------------------- |
| Background             | `#ffffff` (0 0% 100%)     | `#0a0a0a` (0 0% 3.9%)     |
| Foreground             | `#0a0a0a` (0 0% 3.9%)     | `#fafafa` (0 0% 98%)      |
| Primary                | `#171717` (0 0% 9%)       | `#fafafa` (0 0% 98%)      |
| Primary Foreground     | `#fafafa` (0 0% 98%)      | `#171717` (0 0% 9%)       |
| Secondary              | `#f5f5f5` (0 0% 96.1%)    | `#262626` (0 0% 14.9%)    |
| Secondary Foreground   | `#171717` (0 0% 9%)       | `#fafafa` (0 0% 98%)      |
| Muted                  | `#f5f5f5` (0 0% 96.1%)    | `#262626` (0 0% 14.9%)    |
| Muted Foreground       | `#737373` (0 0% 45.1%)    | `#a3a3a3` (0 0% 63.9%)    |
| Accent                 | `#f5f5f5` (0 0% 96.1%)    | `#262626` (0 0% 14.9%)    |
| Accent Foreground      | `#171717` (0 0% 9%)       | `#fafafa` (0 0% 98%)      |
| Destructive            | `#ef4444` (0 84.2% 60.2%) | `#7f1d1d` (0 62.8% 30.6%) |
| Destructive Foreground | `#fafafa` (0 0% 98%)      | `#fafafa` (0 0% 98%)      |
| Border                 | `#e5e5e5` (0 0% 89.8%)    | `#262626` (0 0% 14.9%)    |
| Input                  | `#e5e5e5` (0 0% 89.8%)    | `#262626` (0 0% 14.9%)    |
| Ring                   | `#0a0a0a` (0 0% 3.9%)     | `#d4d4d4` (0 0% 83.1%)    |
| Radius                 | `0.5rem`                  | `0.5rem`                  |

**Typography for shadcn/ui Default:**
| Role | Font | Fallback |
|------|------|----------|
| Headings | Inter | Arial, sans-serif |
| Body | Inter | Arial, sans-serif |
| Code | JetBrains Mono | Consolas, monospace |

**Semantic Colors (derived from shadcn/ui defaults):**
| Role | Hex | Usage |
|------|-----|-------|
| Success | `#22c55e` | Positive actions, confirmations |
| Warning | `#f59e0b` | Cautions, warnings |
| Error | `#ef4444` | Destructive actions, errors |
| Info | `#3b82f6` | Neutral information |

### Google Material Design 3

```markdown
Primary: #6750A4
On Primary: #FFFFFF
Secondary: #625B71
Background: #FFFBFE
Surface: #FFFBFE
Error: #B3261E
Typography: Roboto (headings), Roboto (body)
```

### Tailwind CSS Default

```markdown
Dark: #111827 (gray-900)
Light: #FFFFFF
Primary: #3B82F6 (blue-500)
Secondary: #8B5CF6 (violet-500)
Accent: #F59E0B (amber-500)
Error: #EF4444 (red-500)
Success: #10B981 (emerald-500)
Typography: Inter (headings), Inter (body)
```

### IBM Carbon

```markdown
Dark: #161616
Light: #FFFFFF
Primary: #0F62FE
Secondary: #393939
Typography: IBM Plex Sans (headings), IBM Plex Sans (body)
Typography (mono): IBM Plex Mono (code)
```

### GitHub Primer

```markdown
Dark: #1F2328
Light: #FFFFFF
Primary: #0969DA
Secondary: #8250DF
Success: #1A7F37
Error: #CF222E
Typography: -apple-system, BlinkMacSystemFont (headings), -apple-system (body)
Typography (mono): SFMono-Regular, Consolas (code)
```

### Shopify Polaris

```markdown
Dark: #202223
Light: #FFFFFF
Primary: #008060
Secondary: #5C6AC4
Accent: #8C58BF
Typography: Inter (headings), Inter (body)
Typography (mono): SF Mono, Consolas (code)
```

## Features

### Smart Color Application

Based on the provided palette and artifact type, the skill will:

- Apply heading font to text 24pt and larger
- Apply body font to smaller text
- Use foreground color for primary text on background color
- Use background color for text on foreground color
- Apply primary color to main interactive elements and actions
- Apply secondary color to less prominent elements
- Apply muted colors to subtle backgrounds and disabled states
- Apply accent colors to non-text shapes, cycling through them
- Apply border color to dividers and outlines
- Use semantic colors for status indicators when provided
- Apply ring color for focus states

### Dark Mode Support

When the palette includes dark mode variables (like shadcn/ui), the skill will:

- Provide both light and dark mode versions
- Use the appropriate palette based on the context
- Indicate which colors map between modes
- Generate dark mode CSS media queries or class-based selectors

### CSS Variable Generation

For shadcn/ui and similar design systems, generate proper CSS custom properties:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

### Text Styling Rules

- **Headings (24pt+)**: Use heading font with foreground color (or background color on dark surfaces)
- **Body text**: Use body font with foreground or muted-foreground color
- **Emphasis**: Use primary color for highlights or emphasis
- **Links**: Use primary color or ring color
- **Code blocks**: Use code font with muted background

### Shape and Accent Application

- Main actions: Primary color
- Secondary actions: Secondary color
- Subtle elements: Muted color
- Destructive actions: Destructive color
- Non-text shapes cycle through: primary, secondary, accent, muted
- Borders and dividers: Border color
- Input fields: Input color for background, border color for outline
- Focus rings: Ring color

### Background Handling

- **Light backgrounds**: Use foreground color for text, primary for accents
- **Dark backgrounds**: Use background color for text, adjusted accents
- **Card surfaces**: Use card color, card-foreground for text
- **Popover/modals**: Use popover color, popover-foreground for text
- **Muted sections**: Use muted color for background, muted-foreground for text

## Technical Details

### Color Format Support

The skill accepts colors in multiple formats:

- Hex: `#141413`, `#faf9f5`
- RGB: `rgb(20, 20, 19)`, `rgb(250, 249, 245)`
- HSL: `0 0% 3.9%`, `0 0% 100%` (shadcn/ui format)
- CSS Variables: `var(--color-primary)`
- Tailwind Classes: `bg-gray-900`, `text-blue-500`

### Font Management

- Uses system-installed fonts when available
- Provides automatic fallback to specified alternatives
- No font installation required - works with existing system fonts
- For best results, pre-install specified fonts in your environment

### Application Methods

Depending on the output format:

- **CSS/Tailwind**: Generates CSS custom properties and utility classes
- **PPTX**: Applied via python-pptx
- **HTML**: Inline styles or stylesheet generation
- **React/Vue**: Component-level styles or CSS modules
- **SVG**: Fill and stroke attributes
- **Design tools**: Exportable palette in various formats

## Output Example

After collecting the palette, the skill will confirm and generate appropriate styling:

```
shadcn/ui default theme configured successfully:

Light Mode:
- Background: #ffffff
- Foreground: #0a0a0a
- Primary: #171717
- Secondary: #f5f5f5
- Muted: #f5f5f5
- Accent: #f5f5f5
- Destructive: #ef4444
- Border: #e5e5e5
- Ring: #0a0a0a
- Radius: 0.5rem

Dark Mode:
- Background: #0a0a0a
- Foreground: #fafafa
- Primary: #fafafa
- Secondary: #262626
- Muted: #262626
- Accent: #262626
- Border: #262626
- Ring: #d4d4d4

Typography:
- Headings: Inter (fallback: Arial, sans-serif)
- Body: Inter (fallback: Arial, sans-serif)
- Code: JetBrains Mono (fallback: Consolas, monospace)

I will now apply these to your [slide deck/document/interface].
```

## Non-Negotiable Rules

1. **Always ask for the palette first** - Never apply colors without confirmation
2. **Accept any format** - Be flexible in how users provide their palette
3. **Show the palette back** - Always confirm the active palette before applying
4. **Use presets when requested** - Apply well-known palettes accurately
5. **Preserve accessibility** - Ensure sufficient color contrast (WCAG AA minimum)
6. **Document the choices** - Show CSS variables, classes, or tokens generated
7. **Support dark mode** - When the palette includes it, provide both variants
8. **Be consistent** - Apply the same palette rules throughout the artifact
9. **UI library first** - Before creating any new component, check if a UI library is in use; if so, use its components exclusively and only build custom ones when the library lacks them

## Quick Start Prompts

Users can invoke this skill with:

```
Apply brand styling to this presentation
```

```
Style this document with our brand colors
```

```
Use shadcn/ui default theme for this dashboard
```

```
Apply our design system to this report
```

```
Style this interface with dark mode support
```

The skill will always respond by asking for or confirming the color palette before proceeding.
