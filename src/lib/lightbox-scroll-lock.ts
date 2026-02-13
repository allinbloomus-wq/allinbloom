type LightboxScrollState = {
  scrollX: number;
  scrollY: number;
  lightboxTelegram: string | undefined;
  bodyStyles: {
    overflow: string;
    position: string;
    top: string;
    left: string;
    right: string;
    width: string;
  };
  htmlStyles: {
    overflow: string;
    overscrollBehavior: string;
  };
};

type LockLightboxScrollOptions = {
  isTelegram?: boolean;
};

export function lockLightboxScroll(
  options: LockLightboxScrollOptions = {}
): () => void {
  if (typeof document === "undefined") {
    return () => {};
  }

  const body = document.body;
  const html = document.documentElement;

  const state: LightboxScrollState = {
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    lightboxTelegram: body.dataset.lightboxTelegram,
    bodyStyles: {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    },
    htmlStyles: {
      overflow: html.style.overflow,
      overscrollBehavior: html.style.overscrollBehavior,
    },
  };

  body.dataset.lightboxOpen = "true";
  if (options.isTelegram) {
    body.dataset.lightboxTelegram = "true";
  } else {
    delete body.dataset.lightboxTelegram;
  }
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${state.scrollY}px`;
  body.style.left = `-${state.scrollX}px`;
  body.style.right = "0";
  body.style.width = "100%";

  html.style.overflow = "hidden";
  html.style.overscrollBehavior = "none";

  return () => {
    body.style.overflow = state.bodyStyles.overflow;
    body.style.position = state.bodyStyles.position;
    body.style.top = state.bodyStyles.top;
    body.style.left = state.bodyStyles.left;
    body.style.right = state.bodyStyles.right;
    body.style.width = state.bodyStyles.width;

    html.style.overflow = state.htmlStyles.overflow;
    html.style.overscrollBehavior = state.htmlStyles.overscrollBehavior;

    delete body.dataset.lightboxOpen;
    if (state.lightboxTelegram) {
      body.dataset.lightboxTelegram = state.lightboxTelegram;
    } else {
      delete body.dataset.lightboxTelegram;
    }
    window.scrollTo(state.scrollX, state.scrollY);
  };
}
