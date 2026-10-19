import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "md-outlined-text-field": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        label?: string;
        value?: string;
        required?: boolean;
        disabled?: boolean;
        error?: boolean;
        "supporting-text"?: string;
        maxLength?: number;
      };
      "md-filled-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { disabled?: boolean; type?: "button" | "submit" };
      "md-outlined-button": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { disabled?: boolean; type?: "button" | "submit" };
    }
  }
}
