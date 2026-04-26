'use client';

import { Headphones, MapPin, Mail, Phone, User } from 'lucide-react';
import type { CommercialAgentPublic } from '@/lib/auth';

type Props = {
  agent: CommercialAgentPublic | null | undefined;
  className?: string;
};

/**
 * Shown in grower, logistics, and B2B supplier areas when admin has assigned a commercial agent.
 */
export default function AssignedAgentCard({ agent, className = '' }: Props) {
  if (!agent) return null;
  const office = agent.commercial_agent_profile;
  const line =
    office &&
    [office.address, office.postalCode, office.city, office.country].filter(Boolean).join(', ');

  return (
    <div
      className={`rounded-lg border border-[#2D5A27]/25 bg-gradient-to-r from-[#2D5A27]/5 to-white p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2D5A27]/10 text-[#2D5A27]">
          <Headphones className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Your Bio Vera contact</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-base font-medium text-gray-900">
            <User className="h-4 w-4 shrink-0 text-gray-400" />
            {agent.firstName} {agent.lastName}
            {agent.partnerCode && (
              <span className="text-sm font-normal text-gray-500">({agent.partnerCode})</span>
            )}
          </p>
          {line && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-gray-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              {office?.officeName && <span className="font-medium text-gray-800">{office.officeName} · </span>}
              {line}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="inline-flex items-center gap-1 text-[#2D5A27] hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {agent.email}
              </a>
            )}
            {agent.phone && (
              <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1 text-gray-700 hover:underline">
                <Phone className="h-3.5 w-3.5" />
                {agent.phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
