'use client';

import type { LucideIcon } from 'lucide-react';
import { Leaf, ThermometerSnowflake, ChevronDown, ChevronRight, Apple, Carrot, Wheat } from 'lucide-react';
import { useState } from 'react';

const MONTH_LABELS: { short: string; full: string }[] = [
  { short: 'J', full: 'Jan' }, { short: 'F', full: 'Feb' }, { short: 'M', full: 'Mar' }, { short: 'A', full: 'Apr' },
  { short: 'M', full: 'May' }, { short: 'J', full: 'Jun' }, { short: 'J', full: 'Jul' }, { short: 'A', full: 'Aug' },
  { short: 'S', full: 'Sep' }, { short: 'O', full: 'Oct' }, { short: 'N', full: 'Nov' }, { short: 'D', full: 'Dec' },
];

type ProductHarvest = { name: string; months: number[] };

const FRUITS: ProductHarvest[] = [
  { name: 'Raspberry', months: [5, 6, 7] },
  { name: 'Blackberry', months: [6, 7, 8] },
  { name: 'Blueberry', months: [5, 6, 7] },
  { name: 'Strawberry', months: [5, 6, 7] },
  { name: 'Apple', months: [7, 8, 9, 10] },
  { name: 'Pear', months: [8, 9, 10] },
  { name: 'Plum', months: [8, 9] },
  { name: 'Peach', months: [7, 8] },
  { name: 'Apricot', months: [7] },
  { name: 'Cherry', months: [5, 6, 7] },
  { name: 'Grape', months: [8, 9] },
  { name: 'Currant', months: [6] },
  { name: 'Gooseberry', months: [6] },
];

const VEGETABLES: ProductHarvest[] = [
  { name: 'Pepper', months: [6, 7, 8, 9] },
  { name: 'Tomato', months: [7, 8] },
  { name: 'Cucumber', months: [7, 8] },
  { name: 'Zucchini', months: [7, 8] },
  { name: 'Pumpkin', months: [8, 9, 10] },
  { name: 'Potato', months: [9, 10] },
  { name: 'Carrot', months: [9, 10] },
  { name: 'Beetroot', months: [9, 10] },
  { name: 'Cabbage', months: [9, 10] },
  { name: 'Onion', months: [8] },
  { name: 'Leek', months: [10] },
  { name: 'Asparagus', months: [4] },
  { name: 'Rhubarb', months: [4] },
  { name: 'Lettuce', months: [4, 5, 6] },
  { name: 'Radish', months: [4, 5] },
  { name: 'Spinach', months: [4] },
  { name: 'Pea', months: [5, 6] },
  { name: 'Green bean', months: [6, 7] },
];

const CEREALS: ProductHarvest[] = [
  { name: 'Corn', months: [7, 8] },
  { name: 'Wheat', months: [6] },
  { name: 'Barley', months: [6] },
];

const CATEGORY_ICONS = { fruits: Apple, vegetables: Carrot, cereals: Wheat } as const;
const CATEGORIES: { id: keyof typeof CATEGORY_ICONS; title: string; products: ProductHarvest[] }[] = [
  { id: 'fruits', title: 'Fruits', products: FRUITS },
  { id: 'vegetables', title: 'Vegetables', products: VEGETABLES },
  { id: 'cereals', title: 'Cereals', products: CEREALS },
];

const WHY_NOT_SHOCK = {
  title: 'Why our produce is not in shock',
  points: [
    'No freezing — cold chain for transport only; taste and texture stay as in the field.',
    'Juiciness and natural firmness without temperature shock; nutritional value preserved.',
  ],
};

function CategoryBlock({
  id,
  title,
  Icon,
  products,
  defaultOpen,
}: {
  id: string;
  title: string;
  Icon: LucideIcon;
  products: ProductHarvest[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
          {/* Min width so 12 months always have space; sticky product column */}
          <div className="min-w-[min(100%,28rem)]">
            <div className="flex">
              <div className="sticky left-0 z-10 w-24 sm:w-28 flex-shrink-0 bg-gray-50/90 border-r border-gray-200 py-2 pl-3 pr-2">
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Product</span>
              </div>
              <div className="flex-1 grid grid-cols-12 gap-px py-2 pr-2 pl-1" style={{ minWidth: '12rem' }}>
                {MONTH_LABELS.map(({ short: s, full: f }, i) => (
                  <div key={i} className="text-center text-[10px] text-gray-400 font-medium min-w-[1.25rem]">
                    <span className="sm:hidden">{s}</span>
                    <span className="hidden sm:inline">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            {products.map(({ name, months }, idx) => (
              <div key={name} className={`flex ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <div className="sticky left-0 z-10 w-24 sm:w-28 flex-shrink-0 py-1.5 pl-3 pr-2 border-r border-gray-100 bg-inherit">
                  <span className="text-xs font-light text-gray-800">{name}</span>
                </div>
                <div className="flex-1 grid grid-cols-12 gap-px py-1 pr-2 pl-1" style={{ minWidth: '12rem' }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-4 min-w-[1.25rem] rounded-sm ${months.includes(i) ? 'bg-[#2D5A27]/80' : 'bg-gray-200/50'}`}
                      title={months.includes(i) ? `${name} in harvest` : ''}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HarvestCalendar() {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Leaf className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.5} />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">When harvest is</span>
      </div>
      <p className="text-gray-600 text-sm mb-6 max-w-2xl leading-relaxed">
        Typical harvest window by product. Our produce travels fresh, without freezing — taste and texture stay as in the field.
      </p>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <CategoryBlock
            key={cat.id}
            id={cat.id}
            title={cat.title}
            Icon={CATEGORY_ICONS[cat.id]}
            products={cat.products}
            defaultOpen={cat.id === 'fruits'}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500 font-light">
        Harvest varies by region and year. See actual availability in your buyer dashboard and when placing a pre-order.
      </p>

      <div className="mt-8 rounded-xl border border-[#2D5A27]/20 bg-gray-50/50 overflow-hidden">
        <div className="bg-[#2D5A27] px-4 py-3 flex items-center gap-2">
          <ThermometerSnowflake className="h-5 w-5 text-white" strokeWidth={1.5} />
          <span className="text-sm font-medium text-white">{WHY_NOT_SHOCK.title}</span>
        </div>
        <div className="px-4 py-4 text-gray-800">
          <ul className="space-y-2 text-sm font-light leading-relaxed">
            {WHY_NOT_SHOCK.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
