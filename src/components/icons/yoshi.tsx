import * as React from "react"
import { SVGProps } from "react"

const YoshiIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="10" r="3" />
    <path d="M10 14c-1 2-4 2-4 0" />
    <path d="M14 14c1 2 4 2 4 0" />
    <path d="M12 16c-2 0-3 1-3 2h6c0-1-1-2-3-2z" />
  </svg>
)

export default YoshiIcon
