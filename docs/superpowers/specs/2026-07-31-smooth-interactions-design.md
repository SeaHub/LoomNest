# LoomNest Smooth Interactions Design

## Goal

Keep LoomNest's existing visual language and animated card expansion while removing perceptible stalls from card, filter, theme, and glass-pointer interactions. The primary target is desktop Chromium as exercised through Ego Lite, with equivalent behavior on mobile and for reduced-motion users.

## Diagnosis

Ego Lite reproduction showed that opening a work card combines four expensive operations:

1. a 420 ms `max-height` transition that recalculates layout on every frame;
2. transform animation on the same surface that applies `backdrop-filter: blur(24px)`;
3. a simultaneous smooth `scrollIntoView` call while the detail height is changing;
4. pointer-driven radial-gradient repaints without frame throttling.

Under CPU throttling, the current expansion spent about 19 ms in layout and 19 ms in style recalculation during one interaction. The JavaScript click handler itself was short, so the bottleneck is rendering work after state changes rather than Vue event processing.

## Interaction Design

### Work-card expansion

The row updates its selected state immediately. Vue keeps responsibility for mounting and unmounting the detail, while transition hooks measure the detail's actual height and animate the outer reveal shell between `0px` and that measured height for 220 ms.

The reveal shell owns only height and clipping. The glass panel stays at a stable scale; its inner content uses a short opacity and `translate3d` entrance. This prevents the live blur surface from being continuously rescaled. After expansion, the explicit height is cleared to `auto` so responsive content remains correct.

Closing reverses the measured-height animation. Interrupted transitions cancel the previous animation and continue from the element's current rendered height, preventing rapid repeated clicks from leaving stale inline styles.

Automatic scrolling runs only after expansion completes and only when the revealed detail is outside the usable viewport. It does not overlap the height animation. Reduced-motion users receive the final state immediately with no smooth scrolling.

### Other controls

Filter swapping, button hover/press feedback, and theme feedback use durations between 160 and 220 ms. Transforms use `translate3d` or scale so they remain compositor-friendly.

Glass pointer highlights are updated at most once per animation frame. The highlight pseudo-element moves with a transform instead of recalculating the position of a full-surface radial gradient. Pending animation-frame callbacks are cancelled when the app unmounts.

## Implementation Boundaries

- `src/App.vue` owns transition hooks, conditional post-expansion scrolling, and frame-throttled pointer state.
- `src/styles.css` owns reveal-shell clipping, inner-content motion, compositor hints, and shortened control transitions.
- Existing work normalization, filtering, URL validation, theme persistence, and accessibility semantics remain unchanged.
- No new runtime dependency is introduced.

## Accessibility and Failure Handling

- `aria-expanded`, `aria-controls`, region labels, Escape-to-close, and focus behavior remain intact.
- `prefers-reduced-motion: reduce` bypasses measured animations and smooth scrolling.
- If Web Animations is unavailable, the hook applies the final height and completes immediately.
- Detail content remains usable during and after interrupted transitions.

## Test Strategy

Automated tests will first fail against the current implementation and then cover:

- measured-height transition hooks and interrupted-animation cleanup;
- scrolling only after expansion and only when needed;
- no smooth scrolling under reduced motion;
- frame-throttled pointer updates;
- required transition structure and preserved accessibility state.

Verification includes the existing test suite, a production build, and Ego Lite regression passes for card open, close, rapid card switching, filtering, theme changes, Escape handling, and mobile layout. Ego Lite performance sampling will compare interaction latency, layout/style duration, long animation frames, and visible final state.

## Deployment

After local verification, changes are committed and pushed to `main`. The existing GitHub Actions Pages workflow deploys the production build. Deployment is considered complete only after the workflow succeeds and the public GitHub Pages URL passes the same Ego Lite smoke and interaction regression checks.
