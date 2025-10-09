import * as React from "react"
import { SVGProps } from "react"

const ToadIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M12 2C6.48 2 2 6.48 2 12h20C22 6.48 17.52 2 12 2z" />
    <circle cx="7" cy="8" r="2" fill="currentColor" />
    <circle cx="17" cy="8" r="2" fill="currentColor" />
    <path d="M8 14h8v6H8z" />
    <path d="M10 20v-2" />
    <path d="M14 20v-2" />
  </svg>
)

export default ToadIcon
