import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export const metadata = generateSEO(SEO_CONFIGS.privacy);

export default function PrivacyPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  return (
    <div className='bg-background min-h-screen py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'>
          <div className='border-border border-b px-6 py-8'>
            <h1 className='text-foreground text-3xl font-bold'>Betterlytics Privacy Policy</h1>
            <p className='text-muted-foreground mt-2 text-lg'>
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className='space-y-8 px-6 py-8'>
            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>TL;DR</h2>
              <p className='text-accent-foreground'>
                For website visitors, we do not use cookies and we do not collect any personal data. If you decide
                to create an account, we ask for the bare minimum and only share it with services that are
                absolutely necessary for the app to function.
              </p>
            </section>

            <section className='border-primary bg-accent rounded-r-lg border-l-4 p-6'>
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>Scope of This Policy</h2>
              <p className='text-accent-foreground'>
                This privacy policy applies exclusively to the <strong>Betterlytics hosted cloud service</strong>{' '}
                available at betterlytics.io and our official domains. It does not apply to self-hosted
                installations of our open source software. If you self-host Betterlytics, you are responsible for
                your own privacy policy, data processing practices, and legal compliance.
              </p>
            </section>

            <section>
              <p className='text-foreground leading-relaxed'>
                At Betterlytics, we are committed to complying with GDPR, CCPA, PECR and other privacy regulations.
                The privacy of your data — and it is your data, not ours! — is a big deal to us. We are based in
                the European Union and all data processing occurs within EU boundaries.
              </p>
              <p className='text-foreground mt-4 leading-relaxed'>
                In this policy, we lay out what data we collect and why, how your data is handled and your rights
                to your data. We promise we never sell your data: never have, never will.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>
                As a visitor to websites using Betterlytics
              </h2>
              <p className='text-foreground mb-4'>
                The privacy of website visitors is important to us. We have designed our analytics system to be
                completely cookieless and privacy-focused. As a visitor to websites using Betterlytics:
              </p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>No personal information is collected</li>
                <li>No cookies are stored in your browser</li>
                <li>No information is shared with, sent to or sold to third-parties</li>
                <li>No information is shared with advertising companies</li>
                <li>No information is mined and harvested for personal and behavioral trends</li>
                <li>No information is monetized</li>
                <li>All data collected is aggregated and anonymized</li>
              </ul>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>
                What anonymous data we collect and why
              </h3>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Page Views and Navigation</h4>
                  <p className='text-muted-foreground text-sm'>
                    We track which pages are visited and navigation patterns to help website owners understand how
                    their content is being consumed. We collect the URL path (without query parameters to prevent
                    accidental tracking of sensitive data) and referrer information.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Device and Browser Information</h4>
                  <p className='text-muted-foreground text-sm'>
                    We parse the user agent string to determine browser type, operating system, and device category
                    (mobile, tablet, desktop, laptop). Screen resolution is bucketed into categories (small,
                    medium, large) rather than storing exact dimensions.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Geographic Information</h4>
                  <p className='text-muted-foreground text-sm'>
                    We determine the visitor's country from their IP address using a GeoIP database. The IP address
                    itself is immediately anonymized by removing the last octet (IPv4) or using only the first 64
                    bits (IPv6) before any processing.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Anonymous Visitor Identification</h4>
                  <p className='text-muted-foreground text-sm'>
                    We generate an anonymous visitor fingerprint using a cryptographic hash of the anonymized IP
                    address, bucketed screen resolution, browser name, and a daily rotating salt. This allows us to
                    count unique visitors without tracking individuals. The fingerprint changes daily, ensuring
                    long-term anonymity.
                  </p>
                </div>

                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Session Tracking</h4>
                  <p className='text-muted-foreground text-sm'>
                    We track sessions to understand how visitors engage with websites. Sessions automatically
                    expire after 30 minutes of inactivity and are stored only in server memory, never in cookies or
                    browser storage.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>How we process and store data</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>
                  <strong>EU-based hosting:</strong> All data is processed and stored on servers located within the
                  European Union, ensuring GDPR compliance.
                </li>
                <li>
                  <strong>Immediate anonymization:</strong> IP addresses are anonymized immediately upon receipt,
                  before any processing or storage occurs.
                </li>
                <li>
                  <strong>No cross-site tracking:</strong> Each website's data is isolated and tracked separately
                  with unique site identifiers.
                </li>
                <li>
                  <strong>Aggregated reporting:</strong> All analytics reports show aggregated data only, with no
                  ability to identify individual visitors.
                </li>
                <li>
                  <strong>Daily fingerprint rotation:</strong> Visitor fingerprints change daily, preventing
                  long-term tracking of individuals.
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>
                As a customer and subscriber of Betterlytics
              </h2>
              <p className='text-foreground mb-4'>
                Our guiding principle is to collect only what we need and process this information solely to
                provide you with the service you signed up for.
              </p>

              <div className='space-y-4'>
                <div>
                  <h4 className='text-foreground mb-2 font-semibold'>What we collect and why</h4>
                  <ul className='text-foreground list-disc space-y-2 pl-6'>
                    <li>
                      <strong>Email address:</strong> Required to create an account, send you essential service
                      communications, and provide customer support.
                    </li>
                    <li>
                      <strong>Authentication data:</strong> Secure session tokens to keep you logged in to your
                      dashboard.
                    </li>
                    <li>
                      <strong>Website configuration:</strong> Domain names and site settings you configure for your
                      analytics tracking.
                    </li>
                    <li>
                      <strong>Usage data:</strong> How you use our dashboard to improve our service and provide
                      support.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className='text-foreground mb-2 font-semibold'>Third-party services</h4>
                  <p className='text-foreground mb-2'>
                    We use a select number of trusted, EU-based service providers:
                  </p>
                  <ul className='text-foreground list-disc space-y-1 pl-6'>
                    <li>Payment processing (if applicable) through EU-compliant payment processors</li>
                    <li>Email delivery for transactional emails and notifications</li>
                  </ul>
                  <p className='text-foreground mt-2'>
                    We only share the minimum necessary information with these providers and contractually bind
                    them to protect your data according to GDPR standards.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Data retention</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>
                  <strong>Account deletion:</strong> When you delete your account, ALL data is permanently deleted
                  immediately - this includes your personal data (email, payment information, account settings) AND
                  all website analytics data. No exceptions, no retention period.
                </li>
                <li>
                  <strong>Subscription cancellation (without account deletion):</strong> If you cancel your
                  subscription but keep your account, we retain your analytics data for up to 1 month in case you
                  decide to reactivate, after which it is permanently deleted.
                </li>
                <li>
                  <strong>Session data:</strong> Visitor sessions are stored only in server memory and
                  automatically expire after 30 minutes of inactivity.
                </li>
              </ul>
              <p className='text-foreground mt-4'>You always have the right to immediate deletion of all data.</p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Your rights under GDPR</h3>
              <p className='text-foreground mb-4'>As a data subject under GDPR, you have the following rights:</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>
                  <strong>Right of access:</strong> Request a copy of your personal data
                </li>
                <li>
                  <strong>Right to rectification:</strong> Correct inaccurate personal data
                </li>
                <li>
                  <strong>Right to erasure:</strong> Request deletion of your personal data
                </li>
                <li>
                  <strong>Right to restrict processing:</strong> Limit how we use your data
                </li>
                <li>
                  <strong>Right to data portability:</strong> Receive your data in a portable format
                </li>
                <li>
                  <strong>Right to object:</strong> Object to processing based on legitimate interests
                </li>
                <li>
                  <strong>Right to withdraw consent:</strong> Withdraw consent for data processing
                </li>
              </ul>
              <p className='text-foreground mt-4'>
                To exercise any of these rights, please contact us at privacy@betterlytics.io
              </p>
            </section>

            <section className='border-primary bg-secondary rounded-r-lg border-l-4 p-6'>
              <h3 className='text-secondary-foreground mb-4 text-xl font-semibold'>No cookies policy</h3>
              <p className='text-secondary-foreground'>
                Betterlytics does not use any cookies for tracking website visitors. We achieve all necessary
                analytics functionality through cookieless, server-side processing. This means websites using
                Betterlytics do not need to display cookie consent banners for our analytics tracking.
              </p>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Data security</h3>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>All data transmission is encrypted using TLS 1.3</li>
                <li>Data at rest is encrypted using industry-standard encryption</li>
                <li>Access to data is strictly limited to authorized personnel</li>
                <li>All servers are located in secure EU data centers</li>
              </ul>
            </section>

            <section>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Changes to this privacy policy</h3>
              <p className='text-foreground'>
                We may update this policy as needed to comply with relevant regulations and reflect any new
                practices. Whenever we make significant changes to our policies, we will notify our customers via
                email and announce them on our website.
              </p>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Contact us</h3>
              <p className='text-foreground mb-4'>
                If you have any questions, comments, or concerns about this privacy policy, your data, or your
                rights with respect to your information, please contact us:
              </p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>Email:</strong> privacy@betterlytics.io
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
                Committed to privacy, transparency, and GDPR compliance
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
