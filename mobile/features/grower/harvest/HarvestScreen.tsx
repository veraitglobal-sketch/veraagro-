import HarvestForm from './HarvestForm';

/**
 * Harvest report entry, offline-first. UI in HarvestForm.
 */
export default function HarvestScreen({ embedded = false }: { embedded?: boolean }) {
  return <HarvestForm embedded={embedded} />;
}
