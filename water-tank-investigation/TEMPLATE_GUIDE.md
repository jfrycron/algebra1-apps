# Reusing the Carron App Template

This folder contains the complete editable source for **The Shapes of Algebra – Investigation 1**. Use its outer shell as the default structure for future Algebra 1 apps. The contents and layout inside the workspace should change to fit each activity.

## Default structure

- Compact title and directions above the workspace
- Adaptable upper-right navigation or progress pill
- Minimal outer margins and a large, stable workspace
- Consistent border, corners, shadow, colors, typography, and responsive behavior
- Flexible internal workspace layout

The standard incorrect-answer shake, black-and-white striped feedback, and soft-green celebration are stored separately in the Carron framework's `assets/reference-patterns/domain-range-feedback/` source reference.

## Start a new app safely

1. Copy this folder and give the copy a new project name.
2. Confirm that the copy does not contain `.openai/hosting.json` before creating a different website.
3. Update the page title and description in `app/layout.tsx`.
4. Replace the activity content and workspace internals in `app/page.tsx`.
5. Preserve the outer shell in `app/globals.css`, adapting the workspace internals as needed.
6. Run the lint, test, build, and preview checks before publishing.

Each new app must receive its own hosting identity. Never copy an existing app's project identifier.
