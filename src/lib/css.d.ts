// Allow CSS custom properties (CSS variables) in React's style prop
// without casting. The pattern `style={{ "--foo": "red" }}` should
// type-check without `as React.CSSProperties`.
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

export {};
