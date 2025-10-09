import * as React from "react"
import { SVGProps } from "react"

const MarioIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M5 14c0 2.76 2.24 5 5 5h4c2.76 0 5-2.24 5-5" />
    <path d="M12 10V5c0-1.66-1.34-3-3-3H9" />
    <circle cx="12" cy="10" r="1" fill="#FFF" />
    <path d="M12 10.5c-1 0-2 .5-2 1.5s1 1.5 2 1.5 2-.5 2-1.5-1-1.5-2-1.5" stroke="#FFF"/>
  </svg>
)

export default MarioIcon
