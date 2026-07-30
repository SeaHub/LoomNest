# LoomNest Design QA

## Source visual truth

- Source: `/Users/seahub/.codex/generated_images/019fb392-2515-7f33-9f54-a3408696501d/call_ajOxSfucFUnICSkwbKcOpf2C.png`
- Source concept: option 3, “Living Index · 动态索引”
- Source pixels: 1487 × 1058 PNG

## Rendered implementation evidence

- Full-view implementation: `implementation-selected-1440.png`
- Mobile implementation: `implementation-mobile.png`
- Combined comparison: `design-qa-comparison.png`
- CSS viewport: 1440 × 1024 for desktop comparison; 390 × 844 for mobile check
- Rendered desktop pixels: 1425 × 1013 JPEG from the in-app browser capture (browser scrollbar excluded)
- Density normalization: no scaling or resampling; source and implementation are shown together in the comparison page at the same CSS viewport state. The comparison page itself scales each image to fit the review canvas.
- State: light theme, all works visible, mini-program row expanded; mobile state verified in light theme with all works visible.

## Full-view comparison evidence

`design-qa-comparison.png` places the source and implementation side by side. Both preserve the selected direction’s major hierarchy: compact identity header, left editorial introduction, right works index, compact filters, numbered rows, restrained dividers, and an inline expanded detail region. The implementation uses different demo copy and generated project imagery intentionally because the selected visual is a visual target, not a production content source.

## Focused region comparison evidence

The selected mini-program row was compared in the same expanded state. The implementation keeps the source’s selected-row emphasis, inline detail surface, two-column overview/access split, and QR affordance. The implementation adds accessible alt text and a real QR image linked to the demo destination. No focused region was required for icons because the prototype uses text actions and native controls rather than invented icon artwork.

## Required fidelity surfaces

- Fonts and typography: modern sans-serif display hierarchy plus monospace metadata; large Chinese headline, compact English labels, and row title scale match the reference’s editorial archive character.
- Spacing and layout rhythm: fixed intro/works split on desktop, single-column stack below 900px, compact filter surface, row padding, and expanded-detail inset are aligned to the reference structure.
- Colors and visual tokens: light fog-gray base, black text, orange action state, lavender selected state, and translucent glass surfaces are represented as CSS tokens. Dark theme uses the same hierarchy with deep blue-black surfaces.
- Image quality and asset fidelity: all visible project imagery is raster artwork generated for the prototype or a real QR PNG; no placeholder boxes, inline SVGs, or handcrafted icon drawings are used.
- Copy and content: demo copy is intentionally original and editable through `prototype/works.json`; type-specific labels are generated from the data contract.

## Primary interaction checks

- Category filter updates counts and list contents without navigation.
- Work row expands one detail at a time and closes with Escape.
- Web row exposes a website link; mini-program row exposes QR image and alt text; mobile row exposes App Store and Google Play; future row exposes Coming Soon without an empty link.
- Theme control cycles system → light → dark, persists the selection, and updates the resolved theme label.
- Keyboard focus styles, semantic buttons, `aria-expanded`, `aria-controls`, `aria-pressed`, skip link, and reduced-motion media query are present.
- Browser console warnings/errors: none observed.

## Comparison history

1. Initial comparison found the implementation screenshot used the default viewport and did not share the source’s expanded-row state. The implementation was recaptured at 1440 × 1024 with the mini-program row expanded, and the comparison page was regenerated.
2. The follow-up comparison found no actionable P0/P1/P2 visual or interaction differences. Remaining copy and project imagery differences are intentional demo content.

## Follow-up polish

- P3: replace demo project artwork and links with the creator’s final assets and URLs when the JSON is populated.
- P3: add a small theme icon from the eventual production icon set if one is selected later.

final result: passed
