import type { ReactNode } from 'react';

/** Shared typography for in-app partner plan documents (parity with PartnerPlanProse). */
export function PlanArticle({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-4">{children}</div>;
}

export function PlanH1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-3xl font-light tracking-tight text-gray-900 border-b border-[#2D5A27]/20 pb-3 mb-2">
      {children}
    </h1>
  );
}

export function PlanLead({ children }: { children: ReactNode }) {
  return <p className="text-lg text-gray-600 italic mb-8 -mt-2">{children}</p>;
}

export function PlanDivider() {
  return <hr className="my-8 border-gray-200" />;
}

export function PlanH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-10 text-xl font-semibold text-[#2D5A27] scroll-mt-24 first:mt-0">{children}</h2>
  );
}

export function PlanH3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-lg font-semibold text-gray-900">{children}</h3>;
}

export function PlanP({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-lg font-light leading-relaxed text-gray-800 first:mt-0 ${className}`.trim()}>
      {children}
    </p>
  );
}

export function PlanUl({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-lg leading-relaxed text-gray-800">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PlanOl({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-lg leading-relaxed text-gray-800">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ol>
  );
}

export function PlanBlockquote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="mt-6 border-l-4 border-[#2D5A27]/40 bg-[#2D5A27]/[0.06] py-3 pl-5 pr-4 text-base italic text-gray-800 leading-relaxed rounded-r-lg">
      {children}
    </blockquote>
  );
}

export function PlanTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-base">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                scope="col"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-sm text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
