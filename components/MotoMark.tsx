import type {SVGProps} from 'react';

/** Marca vetorial original do MotoPRO: motocicleta urbana, sem recursos externos. */
export default function MotoMark({size=30,...props}:SVGProps<SVGSVGElement> & {size?:number}){
 return <svg width={size} height={size} viewBox="0 0 88 58" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
  <circle cx="16" cy="42" r="11"/><circle cx="71" cy="42" r="11"/>
  <path d="M16 42h16l9-18 16 1 14 17M32 42h14l12-12M45 30l-6 12M58 25l6-8h9M61 17h14M31 22h17M34 18h9M22 28l7 3 7-9"/>
  <path d="M49 21l6-6h10l-2 6M25 42h-4M51 37h11"/>
 </svg>;
}
