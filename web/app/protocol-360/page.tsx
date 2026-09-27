import { redirect } from 'next/navigation';

/** Legacy locale-free URL — middleware also 301s; this covers direct RSC navigation. */
export default function LegacyProtocol360Page() {
  redirect('/en/protocol-360');
}
