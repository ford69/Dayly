import { ReactNode } from 'react';

type LegalKind = 'privacy' | 'terms';

const CONTENT: Record<
  LegalKind,
  { title: string; updated: string; sections: { heading: string; body: ReactNode }[] }
> = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'September 11, 2026',
    sections: [
      {
        heading: 'Overview',
        body: (
          <p>
            Dayly (“we”, “us”, or “our”) provides a personal planning and habits product. This Privacy
            Policy explains what information we collect, how we use it, and the choices you have.
          </p>
        ),
      },
      {
        heading: 'Information we collect',
        body: (
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="font-medium text-slate-800">Account information</span> — email address
              and authentication credentials (or Google account details when you sign in with Google).
            </li>
            <li>
              <span className="font-medium text-slate-800">Planner content</span> — tasks, habits,
              reminders, preferences, and related activity you create in the app.
            </li>
            <li>
              <span className="font-medium text-slate-800">Technical data</span> — basic logs such as
              IP address, browser type, and timestamps needed to operate and secure the service.
            </li>
          </ul>
        ),
      },
      {
        heading: 'How we use information',
        body: (
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide, maintain, and improve Dayly features.</li>
            <li>Authenticate you and keep your account secure.</li>
            <li>Send optional email reminders or digests when you enable them.</li>
            <li>Diagnose issues, prevent abuse, and comply with legal obligations.</li>
          </ul>
        ),
      },
      {
        heading: 'Sharing',
        body: (
          <p>
            We do not sell your personal information. We may share data with service providers that
            help us run Dayly (for example hosting, database, authentication, or email delivery),
            only as needed to provide the service and under appropriate safeguards.
          </p>
        ),
      },
      {
        heading: 'Data retention',
        body: (
          <p>
            We retain account and planner data while your account is active. You may request deletion
            of your account data by contacting us. Some records may be kept longer when required for
            security, legal, or operational reasons.
          </p>
        ),
      },
      {
        heading: 'Your choices',
        body: (
          <ul className="list-disc pl-5 space-y-2">
            <li>Update account details and notification preferences in the app.</li>
            <li>Disable email reminders if you previously enabled them.</li>
            <li>Contact us to access, correct, or delete personal information we hold about you.</li>
          </ul>
        ),
      },
      {
        heading: 'Security',
        body: (
          <p>
            We use industry-standard measures to protect your information. No method of transmission
            or storage is completely secure, so we cannot guarantee absolute security.
          </p>
        ),
      },
      {
        heading: 'Children',
        body: (
          <p>
            Dayly is not directed to children under 13, and we do not knowingly collect personal
            information from children under 13.
          </p>
        ),
      },
      {
        heading: 'Changes',
        body: (
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy on
            this page and update the “Last updated” date.
          </p>
        ),
      },
      {
        heading: 'Contact',
        body: (
          <p>
            Questions about this Privacy Policy can be sent to the support email associated with your
            Dayly account or project.
          </p>
        ),
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'September 11, 2026',
    sections: [
      {
        heading: 'Agreement',
        body: (
          <p>
            By creating an account or using Dayly, you agree to these Terms of Service. If you do not
            agree, do not use the service.
          </p>
        ),
      },
      {
        heading: 'The service',
        body: (
          <p>
            Dayly is a personal planning and habits application. Features may change over time as we
            improve the product. We may update, suspend, or discontinue parts of the service with
            reasonable notice when practical.
          </p>
        ),
      },
      {
        heading: 'Accounts',
        body: (
          <ul className="list-disc pl-5 space-y-2">
            <li>You must provide accurate account information and keep your credentials secure.</li>
            <li>You are responsible for activity that occurs under your account.</li>
            <li>You must be at least 13 years old to use Dayly.</li>
          </ul>
        ),
      },
      {
        heading: 'Acceptable use',
        body: (
          <ul className="list-disc pl-5 space-y-2">
            <li>Do not misuse the service, attempt unauthorized access, or disrupt other users.</li>
            <li>Do not upload unlawful, harmful, or infringing content.</li>
            <li>Do not reverse engineer or abuse the service beyond normal personal use.</li>
          </ul>
        ),
      },
      {
        heading: 'Your content',
        body: (
          <p>
            You retain ownership of the tasks, habits, and other content you create. You grant us a
            limited license to host, process, and display that content solely to operate Dayly for
            you.
          </p>
        ),
      },
      {
        heading: 'Disclaimers',
        body: (
          <p>
            Dayly is provided “as is” without warranties of any kind, to the fullest extent permitted
            by law. We do not guarantee uninterrupted availability or that the service will meet every
            personal productivity goal.
          </p>
        ),
      },
      {
        heading: 'Limitation of liability',
        body: (
          <p>
            To the fullest extent permitted by law, Dayly and its operators are not liable for
            indirect, incidental, special, consequential, or punitive damages, or any loss of data,
            profits, or goodwill arising from your use of the service.
          </p>
        ),
      },
      {
        heading: 'Termination',
        body: (
          <p>
            You may stop using Dayly at any time. We may suspend or terminate access if you violate
            these terms or if we need to protect the service or other users.
          </p>
        ),
      },
      {
        heading: 'Changes to these terms',
        body: (
          <p>
            We may revise these Terms of Service. Continued use of Dayly after changes become
            effective means you accept the updated terms.
          </p>
        ),
      },
      {
        heading: 'Contact',
        body: (
          <p>
            Questions about these Terms of Service can be sent to the support email associated with
            your Dayly account or project.
          </p>
        ),
      },
    ],
  },
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const page = CONTENT[kind];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/50 to-rose-50/40 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          <img src="/dayly.png" alt="Dayly" className="h-8 w-auto object-contain" />
          Back to Dayly
        </a>

        <article className="mt-8 rounded-3xl border border-white/80 bg-white/85 backdrop-blur-xl shadow-xl p-8 sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {page.updated}</p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-600">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-base font-semibold text-slate-900 mb-2">{section.heading}</h2>
                {section.body}
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-xs text-slate-500">
            <a href="/privacy" className="hover:text-slate-800 transition">
              Privacy Policy
            </a>
            <span className="text-slate-300">|</span>
            <a href="/terms" className="hover:text-slate-800 transition">
              Terms of Service
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
