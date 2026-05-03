'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Briefcase, Send, Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { careersApplyAPI } from '@/lib/api';
import { axiosResponseStatus } from '@/lib/api-error';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import Footer from '@/components/Footer';

const JOB_KEYS = ['dev', 'agritech', 'bizdev'] as const;
export type CareersJobKey = (typeof JOB_KEYS)[number];

const ROLE_GENERAL = 'general';
const ROLE_OTHER = 'other';
type RoleValue = CareersJobKey | typeof ROLE_GENERAL | typeof ROLE_OTHER;

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const COVER_MIN_LEN = 35;

function readFileAsBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? '');
      const i = s.indexOf(',');
      resolve({
        base64: i >= 0 ? s.slice(i + 1) : s,
        mime: file.type || 'application/octet-stream',
      });
    };
    r.onerror = () => reject(new Error('read_failed'));
    r.readAsDataURL(file);
  });
}

function validateResumeFile(file: File): 'invalidType' | 'tooLarge' | null {
  const n = file.name.toLowerCase();
  if (!n.endsWith('.pdf') && !n.endsWith('.doc') && !n.endsWith('.docx')) return 'invalidType';
  if (file.size > MAX_RESUME_BYTES) return 'tooLarge';
  return null;
}

function isCareersJobKey(v: string): v is CareersJobKey {
  return JOB_KEYS.includes(v as CareersJobKey);
}

function CareersApplySkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center pt-24" role="status">
      <div className="w-10 h-10 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" aria-hidden />
    </div>
  );
}

function isLinkedInUrl(raw: string): boolean {
  const t = raw.trim();
  if (!t) return true;
  const u = /^https:\/\//i.test(t) ? t : `https://${t}`;
  try {
    const p = new URL(u);
    const host = p.hostname.toLowerCase();
    return host === 'linkedin.com' || host === 'www.linkedin.com' || host.endsWith('.linkedin.com');
  } catch {
    return false;
  }
}

function CareersApplyInner() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const searchParams = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [role, setRole] = useState<RoleValue>('general');
  const [otherRole, setOtherRole] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeKey, setResumeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const jobParam = searchParams.get('job');

  useEffect(() => {
    if (jobParam && isCareersJobKey(jobParam)) setRole(jobParam);
  }, [jobParam]);

  const roleOptions = useMemo(
    () => [
      { value: 'dev' as RoleValue, labelKey: 'roleOptDev' },
      { value: 'agritech', labelKey: 'roleOptAgri' },
      { value: 'bizdev', labelKey: 'roleOptBiz' },
      { value: ROLE_GENERAL, labelKey: 'roleOptGeneral' },
      { value: ROLE_OTHER, labelKey: 'roleOptOther' },
    ],
    [],
  );

  const appliedRoleTitle = (): string => {
    if (role === ROLE_OTHER) return otherRole.trim();
    if (role === ROLE_GENERAL) return t('careersPage.generalApplicationSubject');
    return t(`careersPage.jobs.${role}.title`);
  };

  const roleKeySubmit = (): string | undefined =>
    role === ROLE_GENERAL ? undefined : role === ROLE_OTHER ? 'other' : role;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    setBusy(true);

    if (role === ROLE_OTHER && otherRole.trim().length < 2) {
      setErrMsg(t('careersApplyPage.otherRoleRequired'));
      setBusy(false);
      return;
    }
    if (coverLetter.trim().length < COVER_MIN_LEN) {
      setErrMsg(t('careersApplyPage.coverTooShort'));
      setBusy(false);
      return;
    }
    const li = linkedin.trim();
    if (li && !isLinkedInUrl(li)) {
      setErrMsg(t('careersApplyPage.linkedinInvalid'));
      setBusy(false);
      return;
    }
    if (!resumeFile) {
      setErrMsg(t('careersApplyPage.cvRequired'));
      setBusy(false);
      return;
    }
    const cvErr = validateResumeFile(resumeFile);
    if (cvErr === 'invalidType') {
      setErrMsg(t('careersApplyPage.cvInvalidType'));
      setBusy(false);
      return;
    }
    if (cvErr === 'tooLarge') {
      setErrMsg(t('careersApplyPage.cvTooLarge'));
      setBusy(false);
      return;
    }

    try {
      const { base64, mime } = await readFileAsBase64(resumeFile);
      await careersApplyAPI.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        roleKey: roleKeySubmit(),
        appliedRoleTitle: appliedRoleTitle(),
        coverLetter: coverLetter.trim(),
        linkedinUrl: li ? (/^https?:\/\//i.test(li) ? li : `https://${li}`) : undefined,
        resumeBase64: base64,
        resumeFileName: resumeFile.name,
        resumeMimeType: mime,
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setPhone('');
      setLinkedin('');
      setRole(jobParam && isCareersJobKey(jobParam) ? jobParam : ROLE_GENERAL);
      setOtherRole('');
      setCoverLetter('');
      setResumeFile(null);
      setResumeKey((k) => k + 1);
      window.setTimeout(() => setSuccess(false), 7000);
    } catch (err: unknown) {
      console.error(err);
      const status = axiosResponseStatus(err);
      const dataMsg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      if (dataMsg && typeof dataMsg === 'string') setErrMsg(dataMsg);
      else if (status === 429) setErrMsg(t('contactPage.errRateLimit'));
      else setErrMsg(t('careersApplyPage.errorFallback'));
    } finally {
      setBusy(false);
    }
  };

  const onRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    setRole((v === ROLE_GENERAL ? ROLE_GENERAL : v === ROLE_OTHER ? ROLE_OTHER : v) as RoleValue);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href={loc('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo1.png" alt={t('footer.logoAlt')} width={56} height={20} className="h-4 w-auto" priority />
            </Link>
            <nav className="flex gap-6 items-center text-sm">
              <Link href={loc('/')} className="text-gray-600 hover:text-[#2D5A27] transition-colors">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-28 pb-24 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href={loc('/careers')}
            className="inline-flex items-center gap-2 text-sm text-[#2D5A27] hover:underline mb-8 font-light"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t('careersApplyPage.backToCareers')}
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#2D5A27]/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-[#2D5A27]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#2D5A27]">{t('footer.careers')}</p>
                <h1 className="text-3xl md:text-4xl font-light text-gray-900">{t('careersApplyPage.heroTitle')}</h1>
              </div>
            </div>
            <p className="text-gray-600 font-light leading-relaxed mb-8">{t('careersApplyPage.heroSubtitle')}</p>

            <div className="rounded-xl border border-gray-200 bg-gray-50/80 shadow-sm p-6 sm:p-8">
              <p className="text-sm text-gray-500 font-light mb-6">{t('careersApplyPage.formIntro')}</p>

              <form className="space-y-6" onSubmit={onSubmit} lang={i18n.language}>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-name">
                      {t('careersApplyPage.nameLabel')}
                    </label>
                    <input
                      id="ca-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                      placeholder={t('careersApplyPage.namePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-email">
                      {t('careersApplyPage.emailLabel')}
                    </label>
                    <input
                      id="ca-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-phone">
                    {t('careersApplyPage.phoneLabel')}
                  </label>
                  <input
                    id="ca-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">{t('careersApplyPage.phoneHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-role">
                    {t('careersApplyPage.roleLabel')}
                  </label>
                  <select
                    id="ca-role"
                    required
                    value={role}
                    onChange={onRoleChange}
                    className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                  >
                    {roleOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(`careersApplyPage.${o.labelKey}`)}
                      </option>
                    ))}
                  </select>
                </div>

                {role === ROLE_OTHER && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-other">
                      {t('careersApplyPage.otherRoleLabel')}
                    </label>
                    <input
                      id="ca-other"
                      required
                      value={otherRole}
                      onChange={(e) => setOtherRole(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                      placeholder={t('careersApplyPage.otherRolePlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-cover">
                    {t('careersApplyPage.coverLabel')}
                  </label>
                  <textarea
                    id="ca-cover"
                    required
                    minLength={COVER_MIN_LEN}
                    rows={7}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light resize-y bg-white min-h-[160px]"
                    placeholder={t('careersApplyPage.coverPlaceholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">{t('careersApplyPage.coverHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2" htmlFor="ca-li">
                    {t('careersApplyPage.linkedinLabel')}
                  </label>
                  <input
                    id="ca-li"
                    type="url"
                    inputMode="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder={t('careersApplyPage.linkedinPlaceholder')}
                    className="w-full min-h-[48px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/25 focus:border-[#2D5A27] outline-none font-light bg-white"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">{t('careersApplyPage.linkedinHint')}</p>
                </div>

                <div>
                  <label htmlFor="ca-cv" className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-2">
                    <Paperclip className="w-4 h-4 text-[#2D5A27]" aria-hidden />
                    {t('careersApplyPage.cvLabel')}
                  </label>
                  <input
                    key={resumeKey}
                    id="ca-cv"
                    required
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-base text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2D5A27] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#23471f] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 rounded-lg border border-gray-300 px-3 py-2 bg-white cursor-pointer min-h-[48px]"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-light">{t('careersApplyPage.cvHint')}</p>
                </div>

                {success && (
                  <div className="p-4 bg-[#2D5A27]/10 border border-[#2D5A27]/25 rounded-lg text-sm text-[#23471f] font-light">
                    {t('careersApplyPage.success')}
                  </div>
                )}

                {errMsg ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 font-light">
                    {errMsg}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-[#2D5A27] text-white text-base font-medium hover:bg-[#23471f] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 focus:ring-offset-2"
                >
                  {busy ? (
                    t('careersApplyPage.sending')
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden />
                      {t('careersApplyPage.submit')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function CareersApplyPage() {
  return (
    <Suspense fallback={<CareersApplySkeleton />}>
      <CareersApplyInner />
    </Suspense>
  );
}
