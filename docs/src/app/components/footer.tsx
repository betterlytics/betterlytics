import ExternalLink from "@/shared/ExternalLink";
import Logo from "./logo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className='border-border border-t py-12'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-8 md:grid-cols-4'>
          <div>
            <div className='mb-4'>
              <Logo variant='simple' showText textSize='lg' priority />
            </div>
            <p className='text-muted-foreground text-sm'>
              Privacy-first web analytics for the modern web. GDPR compliant,
              cookieless, and open source.
            </p>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Company</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <ExternalLink
                  href='https://betterlytics.io/about'
                  className='hover:text-foreground transition-colors'
                >
                  About
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://betterlytics.io/contact'
                  className='hover:text-foreground transition-colors'
                >
                  Contact
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://betterlytics.io/privacy'
                  className='hover:text-foreground transition-colors'
                >
                  Privacy Policy
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://betterlytics.io/terms'
                  className='hover:text-foreground transition-colors'
                >
                  Terms of Service
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://betterlytics.io/dpa'
                  className='hover:text-foreground transition-colors'
                >
                  Data Processing Agreement
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Resources</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <Link
                  href='/docs'
                  className='hover:text-foreground transition-colors'
                >
                  Documentation
                </Link>
              </li>
              <li>
                <ExternalLink
                  href='https://betterlytics.io#pricing'
                  className='hover:text-foreground transition-colors'
                >
                  Pricing
                </ExternalLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className='mb-4 font-semibold'>Connect</h3>
            <ul className='text-muted-foreground space-y-2 text-sm'>
              <li>
                <ExternalLink
                  href='https://github.com/betterlytics/betterlytics'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <svg
                    className='mr-2 h-4 w-4 flex-shrink-0'
                    style={{ width: "1rem", height: "1rem" }}
                    viewBox='0 0 16 16'
                    fill='currentColor'
                  >
                    <path d='M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z' />
                  </svg>
                  GitHub
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://bsky.app/profile/betterlytics.bsky.social'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <svg
                    className='mr-2 h-4 w-4 flex-shrink-0'
                    style={{ width: "1rem", height: "1rem" }}
                    viewBox='0 0 600 530'
                    fill='currentColor'
                  >
                    <path
                      d='M135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z'
                      fill='#1185FE'
                    />
                  </svg>
                  Bluesky
                </ExternalLink>
              </li>
              <li>
                <ExternalLink
                  href='https://discord.com/invite/vwqSvPn6sP'
                  className='hover:text-foreground flex items-center transition-colors'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <svg
                    className='mr-2 h-4 w-4 flex-shrink-0'
                    style={{ width: "1rem", height: "1rem" }}
                    viewBox='0 0 127.14 96.36'
                    fill='currentColor'
                  >
                    <path d='M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.35,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z' />
                  </svg>
                  Discord
                </ExternalLink>
              </li>
            </ul>
          </div>
        </div>
        <div className='border-border/40 mt-8 border-t pt-8 text-center'>
          <p className='text-muted-foreground text-sm'>
            © 2025 Betterlytics. All rights reserved. Open source under AGPL-3.0
            license.
          </p>
        </div>
      </div>
    </footer>
  );
}
