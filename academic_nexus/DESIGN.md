---
name: Academic Nexus
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#111516'
  on-tertiary: '#ffffff'
  tertiary-container: '#26292b'
  on-tertiary-container: '#8d9092'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built for a professional College Event Registration environment, balancing academic prestige with the efficiency of modern SaaS platforms. The visual language conveys trust, clarity, and administrative rigor while remaining approachable for a diverse student body.

The style is **Corporate / Modern**, leaning heavily into **Minimalism** to ensure data density is manageable. It utilizes high-quality typography, generous whitespace, and a systematic approach to hierarchy. The emotional goal is to make the complex logistics of event management feel effortless and organized. The UI avoids unnecessary ornamentation, focusing instead on utility and high legibility across both admin dashboards and student discovery portals.

## Colors
The palette is rooted in a Deep Indigo/Navy (`primary`) to provide an academic foundation. This is contrasted by a vibrant Soft Blue (`secondary`) used for primary actions and interactive states.

- **Backgrounds**: Surfaces primarily use pure white (`#FFFFFF`) with page backgrounds set to a very light Slate (`#F8FAFC`) to differentiate the canvas from the content containers.
- **State Semantics**: Success Green, Warning Amber, and Error Red are used strictly for status indicators, validation feedback, and alerts to ensure high glanceability in dense administrative tables.
- **Text**: Primary text uses the Deep Indigo to maintain high contrast, while secondary metadata uses a muted Neutral Slate.

## Typography
This design system utilizes **Inter** for all roles to leverage its exceptional legibility and systematic weight distribution. 

- **Headlines**: Use a Semi-Bold weight with slight negative letter-spacing for a modern, compact look.
- **Body Text**: Optimized at 16px for standard reading, with 14px reserved for dense data views and sidebars.
- **Labels**: Small labels use a Bold weight and uppercase styling for "Overline" text or column headers in tables to distinguish them from interactive data.
- **Responsive Behavior**: Large headlines scale down significantly on mobile to maintain layout integrity without horizontal scrolling.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum container width of 1280px to prevent excessive line lengths on ultra-wide monitors. 

- **Grid System**: A 12-column grid is used for desktop, transitioning to 8 columns for tablets and 4 columns for mobile. 
- **Spacing Rhythm**: All spacing is based on a 4px baseline. Components use 16px (stack-md) for standard internal padding and 24px (gutter) for horizontal separation between layout blocks.
- **Admin Layout**: Sidebars are fixed at 280px, while the main content area expands. Cards should span full width on mobile but follow column constraints on larger viewports.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Ambient Shadows** to signify interactivity and priority.

- **Level 0 (Flat)**: Background surface (`#F8FAFC`).
- **Level 1 (Raised)**: Primary content cards and table rows. These use a 1px border (`#E2E8F0`) and a very soft, diffused shadow: `0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.03)`.
- **Level 2 (Interactive)**: Hover states on cards and dropdown menus. These use a slightly more pronounced shadow: `0px 10px 15px -3px rgba(0,0,0,0.08)`.
- **Level 3 (Overlays)**: Modals and floating action buttons. These use high-diffusion shadows with a subtle tint of the primary Navy color to integrate them into the brand environment.

## Shapes
The shape language is **Soft** and professional. 

- **Components**: Buttons, input fields, and cards utilize a `0.25rem` (4px) corner radius. This maintains a structured, efficient feel suitable for academic software.
- **Large Elements**: Modals and major layout containers use `0.5rem` (8px) to feel more inviting.
- **Specifics**: Status badges (chips) are the only exception, using a fully rounded (pill-shaped) radius to distinguish them clearly from interactive buttons.

## Components
Consistent application of the following component rules ensures the system remains intuitive:

- **Buttons**:
    - *Primary*: Solid Soft Blue background with White text.
    - *Secondary*: Outlined Soft Blue with a 1px border.
    - *Ghost*: No border, Navy text, appears only on hover.
- **Cards**: Minimalist white containers with a Level 1 shadow and 1px border. Title is always Bold Navy.
- **Tables**: Clean rows with `#F8FAFC` headers. Use 1px horizontal dividers only; avoid vertical borders to maintain a modern, breathable feel.
- **Status Badges**: Small, pill-shaped tags. Use low-saturation background tints (e.g., Success Green at 10% opacity) with high-saturation text for maximum readability without visual noise.
- **Form Fields**: 1px Slate border that shifts to Soft Blue on focus. Labels are always positioned above the input in `label-md` style.
- **Tabs**: Bottom-border style with the active tab highlighted in Soft Blue. This is preferred over "button-style" tabs to maintain a clean SaaS aesthetic.
- **Additional Elements**: Include a "Registration Timeline" stepper component for multi-step event sign-ups and "Capacity Indicators" (progress bars) for event availability.