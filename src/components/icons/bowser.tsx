import * as React from "react"
import { SVGProps } from "react"

const BowserIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2l-10 8h3v10h14V10h3L12 2z" />
    <path d="M6 2l-4 4" />
    <path d="M18 2l4 4" />
    <path d="M10 14h4" />
    <path d="M9 18h6" />
  </svg>
)

export default BowserIcon
