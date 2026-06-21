import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const PlayIcon = memo(({ className, ...props }: SvgProps) => {
  return (
    <svg
      width="24"
      height="24"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M5 5.2748C5 3.56627 6.82609 2.5311 8.32549 3.36522L18.362 9.09041C19.8817 9.93608 19.8817 12.0639 18.362 12.9096L8.32549 18.6348C6.82609 19.4689 5 18.4337 5 16.7252V5.2748Z"
        fill="currentColor"
      />
    </svg>
  );
});

PlayIcon.displayName = "PlayIcon";
