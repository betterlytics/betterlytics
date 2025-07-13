import Link from "next/link";

interface DashboardSectionCardProps {
  title: string;
  description: string;
  href: string;
  features: string[];
}

export function DashboardSectionCard({
  title,
  description,
  href,
  features,
}: DashboardSectionCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <svg
                  className="h-4 w-4 text-green-500 dark:text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg
          className="h-5 w-5 text-blue-500 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-30 transition-opacity duration-200 dark:from-blue-950 dark:to-purple-950 pointer-events-none rounded-lg" />
    </Link>
  );
}
