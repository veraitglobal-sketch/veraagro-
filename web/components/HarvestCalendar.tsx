'use client';

import type { LucideIcon } from 'lucide-react';
import { Leaf, ThermometerSnowflake, ChevronDown, ChevronRight, Apple, Carrot, Wheat } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type ProductRow = { key: string; months: number[] };

const FRUITS: ProductRow[] = [
  { key: 'raspberry', months: [5, 6, 7] },
  { key: 'blackberry', months: [6, 7, 8] },
  { key: 'blueberry', months: [5, 6, 7] },
  { key: 'strawberry', months: [5, 6, 7] },
  { key: 'apple', months: [7, 8, 9, 10] },
  { key: 'pear', months: [8, 9, 10] },
  { key: 'plum', months: [8, 9] },
  { key: 'peach', months: [7, 8] },
  { key: 'apricot', months: [7] },
  { key: 'cherry', months: [5, 6, 7] },
  { key: 'grape', months: [8, 9] },
  { key: 'currant', months: [6] },
  { key: 'gooseberry', months: [6] },
];

const VEGETABLES: ProductRow[] = [
  { key: 'pepper', months: [6, 7, 8, 9] },
  { key: 'tomato', months: [7, 8] },
  { key: 'cucumber', months: [7, 8] },
  { key: 'zucchini', months: [7, 8] },
  { key: 'pumpkin', months: [8, 9, 10] },
  { key: 'potato', months: [9, 10] },
  { key: 'carrot', months: [9, 10] },
  { key: 'beetroot', months: [9, 10] },
  { key: 'cabbage', months: [9, 10] },
  { key: 'onion', months: [8] },
  { key: 'leek', months: [10] },
  { key: 'asparagus', months: [4] },
  { key: 'rhubarb', months: [4] },
  { key: 'lettuce', months: [4, 5, 6] },
  { key: 'radish', months: [4, 5] },
  { key: 'spinach', months: [4] },
  { key: 'pea', months: [5, 6] },
  { key: 'greenBean', months: [6, 7] },
];

const CEREALS: ProductRow[] = [
  { key: 'corn', months: [7, 8] },
  { key: 'wheat', months: [6] },
  { key: 'barley', months: [6] },
];

const CATEGORY_ICONS = { fruits: Apple, vegetables: Carrot, cereals: Wheat } as const;
const CATEGORIES: { id: keyof typeof CATEGORY_ICONS; products: ProductRow[]; defaultOpen: boolean }[] = [
  { id: 'fruits', products: FRUITS, defaultOpen: true },
  { id: 'vegetables', products: VEGETABLES, defaultOpen: false },
  { id: 'cereals', products: CEREALS, defaultOpen: false },
];

function CategoryBlock({
  id,
  title,
  Icon,
  products,
  defaultOpen,
  monthShort,
  monthFull,
  productLabel,
  inHarvest,
}: {
  id: string;
  title: string;
  Icon: LucideIcon;
  products: ProductRow[];
  defaultOpen: boolean;
  monthShort: string[];
  monthFull: string[];
  productLabel: string;
  inHarvest: (name: string) => string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { t } = useTranslation();

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-medium text-gray-800">
          <Icon className="h-5 w-5 text-[#2D5A27]" />
          {title}
          <span className="text-xs font-normal text-gray-500">({products.length})</span>
        </span>
        {open ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {open && (
        <div className="overflow-x-auto">
          <div className="min-w-[min(100%,28rem)]">
            <div className="flex">
              <div className="sticky left-0 z-10 w-24 sm:w-28 flex-shrink-0 bg-gray-50/90 border-r border-gray-200 py-2 pl-3 pr-2">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{productLabel}</span>
              </div>
              <div className="flex-1 grid grid-cols-12 gap-px py-2 pr-2 pl-1" style={{ minWidth: '12rem' }}>
                {Array.from({ length: 12 }, (_, i) => {
                  const s = monthShort[i] ?? '';
                  const f = monthFull[i] ?? '';
                  return (
                    <div key={i} className="text-center text-[10px] text-gray-400 font-medium min-w-[1.25rem]">
                      <span className="sm:hidden">{s}</span>
                      <span className="hidden sm:inline">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {products.map(({ key, months }, idx) => {
              const name = t(`harvestCalendar.products.${key}`);
              return (
                <div key={id + key} className={`flex ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <div className="sticky left-0 z-10 w-24 sm:w-28 flex-shrink-0 py-1.5 pl-3 pr-2 border-r border-gray-100 bg-inherit">
                    <span className="text-xs font-light text-gray-800">{name}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-px py-1 pr-2 pl-1" style={{ minWidth: '12rem' }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <div
                        key={i}
                        className={`h-4 min-w-[1.25rem] rounded-sm ${months.includes(i) ? 'bg-[#2D5A27]/80' : 'bg-gray-200/50'}`}
                        title={months.includes(i) ? inHarvest(name) : ''}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HarvestCalendar() {
  const { t } = useTranslation();

  const monthShort = useMemo(
    () => t('harvestCalendar.monthsShort', { returnObjects: true }) as string[],
    [t],
  );
  const monthFull = useMemo(
    () => t('harvestCalendar.monthsFull', { returnObjects: true }) as string[],
    [t],
  );

  const inHarvest = (name: string) => t('harvestCalendar.inHarvest', { name });
  const whyTitle = t('harvestCalendar.whyNotShock.title');
  const whyPoints = t('harvestCalendar.whyNotShock.points', { returnObjects: true }) as string[];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.5} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('harvestCalendar.eyebrow')}</span>
      </div>
      <p className="text-gray-600 text-sm mb-6 max-w-2xl leading-relaxed">{t('harvestCalendar.intro')}</p>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <CategoryBlock
            key={cat.id}
            id={cat.id}
            title={t(`harvestCalendar.categories.${cat.id}`)}
            Icon={CATEGORY_ICONS[cat.id]}
            products={cat.products}
            defaultOpen={cat.defaultOpen}
            monthShort={monthShort}
            monthFull={monthFull}
            productLabel={t('harvestCalendar.productColumn')}
            inHarvest={inHarvest}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500 font-light">{t('harvestCalendar.footnote')}</p>

      <div className="mt-8 rounded-xl border border-[#2D5A27]/20 bg-gray-50/50 overflow-hidden">
        <div className="bg-[#2D5A27] px-4 py-3 flex items-center gap-2">
          <ThermometerSnowflake className="h-5 w-5 text-white" strokeWidth={1.5} />
          <span className="text-sm font-medium text-white">{whyTitle}</span>
        </div>
        <div className="px-4 py-4 text-gray-800">
          <ul className="space-y-2 text-sm font-light leading-relaxed">
            {whyPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
