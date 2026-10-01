import { redirect } from 'next/navigation';

/** Old season URL — pre-orders now live at /pre-order (season from PRE_ORDER_SEASON). */
export default function PreOrder2026Redirect() {
  redirect('/pre-order');
}
