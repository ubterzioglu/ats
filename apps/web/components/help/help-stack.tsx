"use client";

import { HelpBubble } from "./help-bubble";
import { ScrollTopButton } from "./scroll-top-button";

export function HelpStack() {
  return (
    <div className="help-stack fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <ScrollTopButton />
      <HelpBubble />
    </div>
  );
}
