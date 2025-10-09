import * as React from "react"
import { SVGProps } from "react"

const PeachIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
    <circle cx="12" cy="6" r="2" fill="currentColor" />
  </svg>
)

export default PeachIcon
