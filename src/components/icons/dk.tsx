import * as React from "react"
import { SVGProps } from "react"

const DKIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M4 12h16" />
    <path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8" />
    <path d="M10 12v6" />
    <path d="M14 12v6" />
    <path d="M7 12c0-2.5 1-5 4-5s4 2.5 4 5" />
    <path d="M9 18h6" />
  </svg>
)

export default DKIcon
