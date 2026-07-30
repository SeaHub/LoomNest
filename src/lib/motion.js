export const DETAIL_TRANSITION_MS = 220;

const DETAIL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
const activeHeightAnimations = new WeakMap();

function finalHeight(opening) {
  return opening ? 'auto' : '0px';
}

export function cancelMeasuredHeight(element) {
  const animation = activeHeightAnimations.get(element);
  if (!animation) return null;

  const currentHeight = element.getBoundingClientRect().height;
  activeHeightAnimations.delete(element);
  animation.cancel();
  element.style.height = `${currentHeight}px`;
  element.style.willChange = '';
  return currentHeight;
}

export function animateMeasuredHeight(element, {
  opening,
  reducedMotion = false,
  done = () => {},
} = {}) {
  const interruptedHeight = cancelMeasuredHeight(element);
  const renderedHeight = element.getBoundingClientRect().height;
  const inlineHeight = Number.parseFloat(element.style.height);
  const resumableHeight = Number.isFinite(inlineHeight) && element.style.height !== 'auto'
    ? renderedHeight
    : null;
  const fromHeight = opening
    ? interruptedHeight ?? resumableHeight ?? 0
    : interruptedHeight ?? renderedHeight;
  const toHeight = opening ? element.scrollHeight : 0;

  if (reducedMotion || typeof element.animate !== 'function' || fromHeight === toHeight) {
    element.style.height = finalHeight(opening);
    element.style.willChange = '';
    done();
    return null;
  }

  element.style.height = `${fromHeight}px`;
  element.style.willChange = 'height';

  const animation = element.animate(
    [
      { height: `${fromHeight}px` },
      { height: `${toHeight}px` },
    ],
    {
      duration: DETAIL_TRANSITION_MS,
      easing: DETAIL_EASING,
      fill: 'both',
    },
  );

  let settled = false;

  animation.addEventListener('finish', () => {
    if (settled) return;
    settled = true;

    if (activeHeightAnimations.get(element) === animation) {
      activeHeightAnimations.delete(element);
    }

    element.style.height = finalHeight(opening);
    element.style.willChange = '';
    animation.cancel();
    done();
  });

  animation.addEventListener('cancel', () => {
    if (activeHeightAnimations.get(element) === animation) {
      activeHeightAnimations.delete(element);
    }
  });

  activeHeightAnimations.set(element, animation);
  return animation;
}

export function shouldScrollDetail(rect, {
  height,
  topInset = 112,
  bottomInset = 24,
}) {
  return rect.top < topInset || rect.bottom > height - bottomInset;
}

export function createFrameThrottler(callback, {
  requestFrame = (frameCallback) => requestAnimationFrame(frameCallback),
  cancelFrame = (frameId) => cancelAnimationFrame(frameId),
} = {}) {
  let frameId = null;
  let latestValue;

  return {
    push(value) {
      latestValue = value;
      if (frameId !== null) return;

      frameId = requestFrame(() => {
        frameId = null;
        const valueToDeliver = latestValue;
        latestValue = undefined;
        callback(valueToDeliver);
      });
    },
    cancel() {
      if (frameId !== null) cancelFrame(frameId);
      frameId = null;
      latestValue = undefined;
    },
  };
}
