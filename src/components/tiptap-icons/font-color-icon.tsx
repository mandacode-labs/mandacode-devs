import { memo } from "react";

type SvgProps = React.ComponentPropsWithoutRef<"svg">;

export const FontColorIcon = memo(({ className, ...props }: SvgProps) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.41692 17.4163C5.28532 17.5479 5.21093 17.726 5.21093 17.9121C5.21093 18.0982 5.28532 18.2763 5.41692 18.4079C5.54852 18.5395 5.72661 18.6139 5.9127 18.6139H18.0873C18.2734 18.6139 18.4515 18.5395 18.5831 18.4079C18.7147 18.2763 18.7891 18.0982 18.7891 17.9121C18.7891 17.726 18.7147 17.5479 18.5831 17.4163L12.4967 5.25C12.3651 5.11842 12.187 5.04404 12.0009 5.04404C11.8148 5.04404 11.6368 5.11842 11.5052 5.25L5.41692 17.4163ZM8.00693 15.1995L12.0009 7.21505L15.9949 15.1995H8.00693Z"
      />
      <path d="M4 20.25H20V21.75H4V20.25Z" />
    </svg>
  );
});

FontColorIcon.displayName = "FontColorIcon";
