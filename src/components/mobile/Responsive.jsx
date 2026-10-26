import { useMobile } from '../../useMobile'

export default function Responsive({ mobile, children }) {
  return useMobile() ? mobile : children
}
