import { generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { redirect } from 'next/navigation';
import { env } from '@/lib/env';

export const metadata = generateSEO(SEO_CONFIGS.dpa);

export default function DPAPage() {
  if (!env.IS_CLOUD) {
    redirect('/');
  }

  return (
    <div className='bg-background py-12'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='bg-card border-border overflow-hidden rounded-lg border shadow-sm'>
          <div className='border-border border-b px-6 py-8'>
            <h1 className='text-foreground text-3xl font-bold'>Data Processing Agreement (DPA)</h1>
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
              <h2 className='text-accent-foreground mb-3 text-xl font-semibold'>Scope of This DPA</h2>
              <p className='text-accent-foreground'>
                This Data Processing Agreement applies exclusively to the{' '}
                <strong>Betterlytics hosted cloud service</strong> available at betterlytics.io and our official
                domains. It does not apply to self-hosted installations of our open source software. If you
                self-host Betterlytics, you are responsible for your own data processing agreements and legal
                compliance.
              </p>
            </section>

            <section className='border-primary bg-secondary rounded-r-lg border-l-4 p-6'>
              <h2 className='text-secondary-foreground mb-3 text-xl font-semibold'>Why This DPA Is Different</h2>
              <p className='text-secondary-foreground'>
                Unlike traditional analytics services, Betterlytics is designed to be anonymous-by-design. We
                process no personal data, making this one of the simplest DPAs in the analytics industry.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>1. Introduction</h2>
              <p className='text-foreground mb-4 leading-relaxed'>
                This Data Processing Agreement ("DPA") forms part of the Betterlytics Terms of Service and governs
                the processing of data when you use our analytics service. This agreement is designed to ensure
                compliance with the General Data Protection Regulation (GDPR) and other applicable data protection
                laws.
              </p>
              <p className='text-foreground leading-relaxed'>
                <strong>Important:</strong> Betterlytics is specifically designed to process only anonymous,
                aggregated data. No personal data is collected, stored, or processed by our service.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>2. Definitions</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>
                    <strong>"Data Controller":</strong> You (the customer) who determines the purposes and means of
                    processing data from your website visitors.
                  </p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>
                    <strong>"Data Processor":</strong> Betterlytics, who processes data on your behalf according to
                    your instructions.
                  </p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>
                    <strong>"Processing":</strong> In our case, the collection and analysis of anonymous,
                    aggregated website analytics data.
                  </p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>
                    <strong>"Personal Data":</strong> Not applicable - Betterlytics is designed to avoid processing
                    any personal data.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>3. Data Processing Details</h2>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>3.1 Nature and Purpose of Processing</h3>
              <ul className='text-foreground mb-6 list-disc space-y-2 pl-6'>
                <li>Providing anonymous website analytics and visitor insights</li>
                <li>Generating aggregated reports on website traffic and usage patterns</li>
                <li>Detecting and filtering bot traffic for accurate statistics</li>
              </ul>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>3.2 Categories of Data</h3>
              <div className='bg-muted mb-6 rounded-lg p-4'>
                <p className='text-foreground mb-2'>
                  <strong>Anonymous data only:</strong>
                </p>
                <ul className='text-muted-foreground list-disc space-y-1 pl-6 text-sm'>
                  <li>Anonymized IP addresses (last octet removed immediately)</li>
                  <li>Bucketed screen resolutions (small/medium/large categories)</li>
                  <li>Browser and operating system information</li>
                  <li>Country-level geographic data</li>
                  <li>Page URLs and referrer information</li>
                  <li>Daily-rotating visitor fingerprints (anonymous identification)</li>
                </ul>
              </div>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>3.3 Data Subjects</h3>
              <p className='text-foreground mb-6'>
                Not applicable - our system is designed to prevent identification of individual data subjects. All
                data is processed in aggregate and anonymous form only.
              </p>

              <h3 className='text-foreground mb-3 text-lg font-semibold'>3.4 Processing Location</h3>
              <p className='text-foreground'>
                All data processing occurs within the European Union on servers located in secure EU data centers.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>4. Your Instructions</h2>
              <p className='text-foreground mb-4'>By using Betterlytics, you instruct us to:</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>Collect anonymous analytics data from your website visitors</li>
                <li>Process this data to generate website analytics and insights</li>
                <li>Store the data for the duration of your subscription</li>
                <li>Delete all data immediately upon account deletion</li>
                <li>Provide you with analytics reports and access to your data</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>5. Security Measures</h2>
              <p className='text-foreground mb-4'>
                Betterlytics implements appropriate technical and organizational measures to ensure data security:
              </p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>All data transmission encrypted using TLS 1.2/1.3</li>
                <li>Data at rest encrypted using industry-standard encryption</li>
                <li>Access controls limiting data access to authorized personnel only</li>
                <li>Regular security audits and updates</li>
                <li>EU-based servers in secure data centers</li>
                <li>Immediate IP anonymization at data collection point</li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>6. Subprocessors</h2>
              <p className='text-foreground mb-4'>
                Betterlytics may engage the following categories of subprocessors:
              </p>
              <div className='space-y-3'>
                <div className='bg-muted rounded-lg p-4'>
                  <p className='text-foreground'>
                    <strong>Infrastructure providers:</strong> EU-based cloud hosting and infrastructure services
                  </p>
                </div>
              </div>
              <p className='text-foreground mt-4'>
                We will notify you of any changes to our subprocessors and obtain your consent where required by
                law.
              </p>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>7. Data Subject Rights</h2>
              <div className='border-primary bg-accent rounded-r-lg border-l-4 p-4'>
                <p className='text-accent-foreground'>
                  <strong>Not applicable:</strong> Since Betterlytics processes only anonymous data, individual
                  data subject rights (access, rectification, erasure, etc.) do not apply to our analytics data.
                  Visitors cannot be identified in our system, making individual rights requests impossible to
                  fulfill.
                </p>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>8. Data Breach Notification</h2>
              <p className='text-foreground mb-4'>
                In the unlikely event of a security incident affecting our service:
              </p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>We will notify you within 72 hours of becoming aware of any incident</li>
                <li>We will provide details of the incident and our response measures</li>
                <li>We will assist with any required notifications to data protection authorities</li>
                <li>
                  <strong>Note:</strong> Risk to individuals is minimal given our anonymous-only data processing
                </li>
              </ul>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>9. Data Deletion and Return</h2>
              <div className='space-y-4'>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Account Deletion</h4>
                  <p className='text-muted-foreground text-sm'>
                    All data (personal and analytics) is permanently deleted immediately upon account deletion.
                  </p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Subscription Cancellation</h4>
                  <p className='text-muted-foreground text-sm'>
                    Analytics data is retained for 1 month in case you return, then permanently deleted.
                  </p>
                </div>
                <div className='bg-muted rounded-lg p-4'>
                  <h4 className='text-foreground mb-2 font-semibold'>Data Export</h4>
                  <p className='text-muted-foreground text-sm'>
                    You can export your analytics data at any time through your dashboard.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className='text-foreground mb-4 text-2xl font-semibold'>10. Audits and Compliance</h2>
              <p className='text-foreground mb-4'>Betterlytics maintains compliance through:</p>
              <ul className='text-foreground list-disc space-y-2 pl-6'>
                <li>Regular internal security and privacy assessments</li>
                <li>Transparent, open-source codebase for technical verification</li>
                <li>Public privacy policy and terms of service</li>
                <li>Commitment to cooperate with reasonable audit requests from enterprise customers</li>
              </ul>
            </section>

            <section className='bg-muted rounded-lg p-6'>
              <h3 className='text-foreground mb-4 text-xl font-semibold'>Contact for DPA Matters</h3>
              <p className='text-foreground mb-4'>For questions about this DPA or data processing practices:</p>
              <div className='text-foreground space-y-2'>
                <p>
                  <strong>Legal inquiries:</strong> legal@betterlytics.io
                </p>
                <p>
                  <strong>Technical questions:</strong> support@betterlytics.io
                </p>
              </div>
            </section>

            <section className='border-border border-t py-6'>
              <p className='text-muted-foreground text-center text-sm'>
                This DPA is automatically accepted when you use Betterlytics and forms part of our Terms of
                Service.
                <br />
                🇪🇺 Anonymous-by-design analytics - Made and hosted in the European Union
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
