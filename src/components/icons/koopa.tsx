import * as React from "react"
import { SVGProps } from "react"

const KoopaIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M2 12s2-8 10-8 10 8 10 8-2 8-10 8-10-8-10-8z" />
    <path d="M4 12h16" />
    <path d="M12 4v16" />
    <path d="M7.5 7.5l9 9" />
    <path d="M16.5 7.5l-9 9" />
  </svg>
)

export default KoopaIcon
