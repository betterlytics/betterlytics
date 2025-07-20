import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';
import { getEffectiveLanguage, loadDictionary, SupportedLanguages } from '@/dictionaries/dictionaries';
import { toLocaleDateString } from '@/utils/dateFormatters';

export const metadata = generateSEO(SEO_CONFIGS.terms);

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: TermsPageProps) {
  const language: SupportedLanguages = getEffectiveLanguage((await params).locale);
  const dict = loadDictionary(language);

  if (!env.IS_CLOUD) {
    redirect(`/${language}/`);
  }

  return (
    <div className='bg-background min-h-screen py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'>
          <div className='border-border border-b px-6 py-8'>
            <h1 className='text-foreground text-3xl font-bold'>{dict.public.terms.title}</h1>
            <p className='text-muted-foreground mt-2 text-lg'>
              {`${dict.public.terms.lastUpdated}: ${toLocaleDateString(new Date(), language)}`}
            </p>
          </div>

          <div className='space-y-8 px-6 py-8'>
            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>Scope of These Terms</h2>
              <p className='text-accent-foreground'>
                These Terms of Service apply exclusively to the <strong>Betterlytics hosted cloud service</strong>{' '}
                available at betterlytics.io and our official domains. They do not apply to self-hosted
                installations of our open source software. If you self-host Betterlytics, you are responsible for
                your own terms of service, data processing, and legal compliance.
              </p>
            </section>

            <section>
              <p className='text-foreground leading-relaxed'>
                Thank you for using Betterlytics! When we say "company", "we", "our", "us", "service" or "services"
                in this document, we are referring to Betterlytics and our privacy-focused web analytics platform.
              </p>
              <p className='text-foreground mt-4 leading-relaxed'>
                We may update these Terms of Service in the future. Whenever we make significant changes to our
                policies, we will notify our customers via email and announce them on our website. When you use our
                service, now or in the future, you are agreeing to the latest Terms of Service.
              </p>
              <p className='text-foreground mt-4 leading-relaxed'>
                If you do not agree to these Terms of Service, do not use this service. Violation of any of the
                terms below may result in the termination of your account.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Account Terms</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>
                  <strong>Security responsibility:</strong> You are responsible for maintaining the security of
                  your account and password. Betterlytics cannot and will not be liable for any loss or damage from
                  your failure to comply with this security obligation.
                </li>
                <li>
                  <strong>Account activity:</strong> You are responsible for any activity that occurs under your
                  account, including activity by team members you invite to your account.
                </li>
                <li>
                  <strong>Legal compliance:</strong> You may not use our service for any illegal purpose or to
                  violate any laws in your jurisdiction.
                </li>
                <li>
                  <strong>Registration requirements:</strong> You must provide a valid email address to complete
                  the signup process. You must be a human - accounts registered by bots or automated methods are
                  not permitted.
                </li>
                <li>
                  <strong>Website ownership:</strong> You must own or have explicit permission to install our
                  analytics script on any website you track with Betterlytics.
                </li>
                <li>
                  <strong>Data accuracy:</strong> You agree to provide accurate information about your websites and
                  not to intentionally send false or misleading data to our service.
                </li>
                <li>
                  <strong>Age requirements:</strong> You must be at least 18 years old to use our service. If you
                  are between 13-17, you may use our service only with parental consent.
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Acceptable Use</h2>
              <div className='space-y-4'>
                <p className='text-foreground'>
                  Betterlytics is designed for legitimate website analytics and is built as an open source project
                  for transparency. You agree not to use our service to:
                </p>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>Track visitors without their knowledge or in violation of privacy laws</li>
                  <li>Collect personally identifiable information (our system is designed to prevent this)</li>
                  <li>Generate artificial or bot traffic to inflate statistics or abuse our infrastructure</li>
                  <li>Track websites you don't own without explicit permission</li>
                  <li>
                    Abuse our service infrastructure, bypass rate limits, or send malformed data that could harm
                    our systems
                  </li>
                  <li>Use our service to harm, harass, or violate the privacy of any individual</li>
                  <li>Violate any applicable laws, including GDPR, CCPA, or other privacy regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Payment, Refunds, and Plan Changes</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Free Tier</h4>
                  <p className='text-muted-foreground text-sm'>
                    We offer a permanently free tier with a monthly event limit as specified on our pricing page.
                    No credit card is required for the free tier. We do not sell your data - ever, regardless of
                    which plan you use.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Billing</h4>
                  <p className='text-muted-foreground text-sm'>
                    You can use our free tier indefinitely within the monthly event limits. For higher usage, you
                    need to upgrade to a paid plan and pay in advance. If you exceed plan limits without upgrading,
                    you risk losing excess data. If paid accounts become overdue, we will freeze the account until
                    payment is made.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Event Limits</h4>
                  <p className='text-muted-foreground text-sm'>
                    Each plan includes a monthly limit of events (pageviews, custom events, etc.). Unused events do
                    not roll over to the next month. You will never be charged extra for occasional traffic spikes.
                    If you consistently exceed your plan limits for two consecutive months, we will contact you to
                    discuss upgrading.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Plan Changes</h4>
                  <p className='text-muted-foreground text-sm'>
                    You can upgrade or downgrade your plan at any time. Upgrades take effect immediately.
                    Downgrading may result in loss of features or capacity. We do not accept liability for any data
                    loss resulting from plan downgrades.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Refunds</h4>
                  <p className='text-muted-foreground text-sm'>
                    All fees are non-refundable. However, if you experience significant service issues within the
                    first 30 days, please contact us and we'll work with you to find a fair solution.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Cancellation and Termination</h2>
              <div className='space-y-4'>
                <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                  <h4 className='text-accent-foreground mb-2 font-semibold'>
                    Important: Two Types of Cancellation
                  </h4>
                  <ul className='text-accent-foreground list-disc space-y-1 pl-4 text-sm'>
                    <li>
                      <strong>Subscription cancellation:</strong> Keeps your account but stops billing. Analytics
                      data retained for 1 month.
                    </li>
                    <li>
                      <strong>Account deletion:</strong> Permanently deletes everything immediately, including all
                      analytics data.
                    </li>
                  </ul>
                </div>

                <h4 className='text-foreground font-semibold'>How to Cancel</h4>
                <p className='text-foreground'>
                  You can cancel your subscription or delete your account entirely through your account settings.
                  An email request alone is not considered proper cancellation.
                </p>

                <h4 className='text-foreground font-semibold'>What Happens When You Cancel</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>
                    <strong>Subscription cancellation:</strong> Your cancellation takes effect at the end of your
                    current billing period. You won't be charged again. Your analytics data becomes inaccessible
                    but is retained for 1 month in case you return, then permanently deleted.
                  </li>
                  <li>
                    <strong>Account deletion:</strong> All data (personal and analytics) is permanently deleted
                    immediately. This cannot be undone.
                  </li>
                </ul>

                <h4 className='text-foreground font-semibold'>Our Right to Terminate</h4>
                <p className='text-foreground'>
                  We reserve the right to suspend or terminate your account for violation of these terms, illegal
                  activity, or abuse of our service or team members. We will provide notice when possible, but
                  immediate termination may be necessary in severe cases.
                </p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Service Modifications and Pricing</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>
                  <strong>Service changes:</strong> We reserve the right to modify or discontinue any part of the
                  service with or without notice. We will communicate significant changes affecting your usage in
                  advance when possible.
                </li>
                <li>
                  <strong>Pricing changes:</strong> We may change our pricing structure. Existing customers are
                  typically exempt from price increases, but we reserve the right to change prices for all
                  customers with at least 30 days notice via email.
                </li>
                <li>
                  <strong>Feature updates:</strong> We regularly improve our service with new features and
                  enhancements. Some features may require plan upgrades.
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Data Ownership and Privacy</h2>
              <div className='space-y-4'>
                <div className='bg-secondary border-primary rounded-r-lg border-l-4 p-4'>
                  <h4 className='text-secondary-foreground mb-2 font-semibold'>Your Data Rights</h4>
                  <p className='text-secondary-foreground text-sm'>
                    You own 100% of your analytics data. We claim no intellectual property rights over your website
                    data and will never sell or share it with third parties.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Data Processing Agreement</h4>
                  <p className='text-muted-foreground text-sm'>
                    For enterprise customers and GDPR compliance, our comprehensive Data Processing Agreement (DPA)
                    is available at{' '}
                    <Link href={`/${language}/dpa`} className='text-primary hover:underline'>
                      /dpa
                    </Link>
                    . The DPA forms part of these Terms of Service and governs how we process data on your behalf.
                  </p>
                </div>

                <h4 className='text-foreground font-semibold'>What We Collect</h4>
                <p className='text-foreground'>
                  Our service is designed to be privacy-first and cookieless. We collect only anonymous, aggregated
                  data as detailed in our Privacy Policy. We do not collect personally identifiable information.
                </p>

                <h4 className='text-foreground font-semibold'>Your Responsibilities</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>
                    Ensure your use of our service complies with all applicable privacy laws (GDPR, CCPA, etc.)
                  </li>
                  <li>
                    Update your privacy policy to mention the use of Betterlytics for anonymous analytics (note: no
                    cookie consent banner is typically required since our service is cookieless)
                  </li>
                  <li>
                    Do not attempt to send sensitive information (credit cards, personal data, etc.) through our
                    service, including in URL paths or query parameters.
                  </li>
                  <li>Maintain security of your account and immediately report any unauthorized access</li>
                </ul>

                <h4 className='text-foreground font-semibold'>Our Commitments</h4>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>Process your data only as described in our Privacy Policy</li>
                  <li>Implement appropriate security measures to protect your data</li>
                  <li>Never sell, share, or monetize your analytics data</li>
                  <li>Provide EU-based hosting and processing for GDPR compliance</li>
                  <li>Delete your data immediately upon account deletion</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Service Level and Support</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Service Availability</h4>
                  <p className='text-muted-foreground text-sm'>
                    We strive for high availability but provide the service on an "as is" and "as available" basis.
                    We make no guarantees about uptime, though we work hard to maintain reliable service.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Support</h4>
                  <p className='text-muted-foreground text-sm'>
                    Technical support is provided via email on a reasonable effort basis. We aim to respond
                    promptly but do not guarantee specific response times.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Bugs and Issues</h4>
                  <p className='text-muted-foreground text-sm'>
                    We test our features extensively, but no software is perfect. We track reported bugs and
                    prioritize fixes, especially for security or privacy issues. Not all reported bugs will be
                    fixed immediately.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Liability and Disclaimers</h2>
              <div className='space-y-4'>
                <p className='text-foreground'>
                  You expressly understand and agree that Betterlytics shall not be liable for any direct,
                  indirect, incidental, special, consequential, or exemplary damages, including but not limited to:
                </p>
                <ul className='text-foreground list-disc space-y-2 pl-6'>
                  <li>Loss of profits, goodwill, use, data, or other intangible losses</li>
                  <li>The use or inability to use our services</li>
                  <li>Unauthorized access to or alteration of your data</li>
                  <li>Statements or conduct of any third party</li>
                  <li>Any other matter relating to these Terms or our services</li>
                </ul>

                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-muted-foreground text-sm'>
                    <strong>What this means:</strong> While we work hard to provide reliable, privacy-focused
                    analytics, technology isn't perfect and things can go wrong. By using Betterlytics, you
                    understand that we can't be held responsible for any business losses or problems that might
                    result from service issues. We're committed to earning your trust through transparency, strong
                    security practices, and putting your privacy first.
                  </p>
                </div>

                <p className='text-foreground'>
                  This agreement shall be governed by the laws of the European Union and the jurisdiction where
                  Betterlytics is legally established.
                </p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Intellectual Property</h2>
              <ul className='text-foreground list-disc space-y-3 pl-6'>
                <li>
                  <strong>Your content:</strong> You retain all rights to any content you provide to our service.
                  Your website data remains yours.
                </li>
                <li>
                  <strong>Our service:</strong> The look, feel, and functionality of Betterlytics is our
                  intellectual property. You may not copy, modify, or reverse engineer our service.
                </li>
                <li>
                  <strong>Feedback:</strong> If you provide feedback or suggestions about our service, you agree
                  that we may use and incorporate that feedback without payment or attribution.
                </li>
                <li>
                  <strong>Trademarks:</strong> "Betterlytics" and our logo are our trademarks. You may not use them
                  without written permission, except to identify our service in connection with your legitimate
                  use.
                </li>
                <li>
                  <strong>Open source components:</strong> Our analytics script and core components are released
                  under open source licenses. This does not grant rights to our hosted service, trademarks, or
                  proprietary infrastructure.
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>Updates and Communication</h2>
              <p className='text-foreground mb-4'>
                We may update these Terms of Service from time to time. When we make significant changes:
              </p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>We will notify you via email at least 30 days in advance</li>
                <li>We will post updates on our website</li>
                <li>Continued use of our service after changes take effect constitutes acceptance</li>
                <li>If you don't agree with changes, you may cancel your account</li>
              </ul>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Contact Us</h3>
              <p className='text-foreground mb-4'>
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>Email:</strong> legal@betterlytics.io
                </p>
                <p>
                  <strong>Support:</strong> support@betterlytics.io
                </p>
                <p>
                  <strong>Address:</strong> Betterlytics, EU
                </p>
              </div>
            </section>

            <section className='border-border border-t py-6 text-center'>
              <p className='text-muted-foreground text-sm'>
                🇪🇺 Made and hosted in the European Union
                <br />
                Privacy-focused analytics you can trust
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
