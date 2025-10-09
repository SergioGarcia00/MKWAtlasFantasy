import * as React from "react"
import { SVGProps } from "react"

const LuigiIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M5 14v-4h14v4" />
    <path d="M5 14c0 3.31 2.69 6 6 6h2c3.31 0 6-2.69 6-6" />
    <path d="M12 10V4c0-1.66-1.34-3-3-3h-1" />
    <circle cx="12" cy="10" r="1" fill="#FFF" />
    <path d="M11 9h2v4h-2z" fill="#FFF" stroke="none" />
    <path d="M11 13h4v1h-4z" fill="#FFF" stroke="none" />
  </svg>
)

export default LuigiIcon
