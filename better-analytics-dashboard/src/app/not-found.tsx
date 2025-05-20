import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground pb-12">
      <div className="container mx-auto flex flex-col items-center justify-center space-y-12 px-4 text-center">
        {/* Light mode logo */}
        <Image
          src="/betterlytics-logo-full-dark-4098x2500.png"
          alt="Betterlytics Logo - Light Mode"
          width={300}
          height={100}
          className="object-contain dark:hidden"
        />
        {/* Dark mode logo */}
        <Image
          src="/betterlytics-logo-full-light-4098x2500.png"
          alt="Betterlytics Logo - Dark Mode"
          width={300}
          height={100}
          className="hidden object-contain dark:block"
        />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            404 - Page Not Found
          </h1>
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Oops! It looks like the page you&apos;re looking for doesn&apos;t exist.
            Don&apos;t worry, you can find plenty of other things on the dashboard.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
} 