"use client";

import { Fragment } from "react";

type FeatureValue = boolean | string;

interface FeatureRow {
  name: string;
  cloud: FeatureValue;
  selfHosted: FeatureValue;
}

interface FeatureCategory {
  name: string;
  features: FeatureRow[];
}

const INFO_ROWS: FeatureRow[] = [
  { name: "Setup time", cloud: "Minutes", selfHosted: "~1 hour" },
  { name: "Updates", cloud: "Automatic", selfHosted: "Manual" },
  {
    name: "Data location",
    cloud: "EU cloud infrastructure",
    selfHosted: "Your servers",
  },
];

const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    name: "Privacy & Compliance",
    features: [
      { name: "Cookieless tracking", cloud: true, selfHosted: true },
      { name: "GDPR/CCPA/PECR ready", cloud: true, selfHosted: true },
      { name: "No cookie banner needed", cloud: true, selfHosted: true },
    ],
  },
  {
    name: "Analytics",
    features: [
      { name: "Core analytics", cloud: true, selfHosted: true },
      { name: "Real-time data", cloud: true, selfHosted: true },
      { name: "Custom events", cloud: true, selfHosted: true },
      { name: "Funnels", cloud: true, selfHosted: true },
      { name: "User journeys", cloud: true, selfHosted: true },
      { name: "Retention", cloud: true, selfHosted: true },
      { name: "Geographic insights", cloud: true, selfHosted: true },
      { name: "Campaign tracking (UTM)", cloud: true, selfHosted: true },
      { name: "Outbound link tracking", cloud: true, selfHosted: true },
      { name: "Annotations", cloud: true, selfHosted: true },
      { name: "Session replays", cloud: true, selfHosted: false },
    ],
  },
  {
    name: "Monitoring",
    features: [
      { name: "Core Web Vitals", cloud: true, selfHosted: true },
      { name: "Uptime monitoring", cloud: true, selfHosted: "Configurable" },
      { name: "SSL certificate monitoring", cloud: true, selfHosted: "Configurable" },
      { name: "Email reports", cloud: true, selfHosted: "Configurable" },
    ],
  },
  {
    name: "Access & Security",
    features: [
      { name: "Role-based access control", cloud: true, selfHosted: true },
      { name: "Two-factor authentication", cloud: true, selfHosted: true },
      { name: "OAuth (Google, GitHub)", cloud: true, selfHosted: false },
    ],
  },
];

function ValueCell({ value }: { value: FeatureValue }) {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className="flex justify-center">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
            <svg
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--muted)]">
          <svg
            className="h-4 w-4 text-[color:var(--muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <span className="text-sm font-medium text-[color:var(--foreground)]">
      {value}
    </span>
  );
}

export function HostingComparisonTable() {
  return (
    <div className="my-6">
      <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--card)]">
        {/* Desktop */}
        <table className="hidden w-full md:table">
          <thead>
            <tr className="border-b border-[color:var(--border)] bg-[color:var(--muted)]">
              <th className="px-6 py-4 text-left">
                <span className="text-sm font-medium text-[color:var(--muted-foreground)]">
                  Feature
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">
                  Cloud
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">
                  Self-Hosted
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Info rows */}
            {INFO_ROWS.map((row, idx) => (
              <tr
                key={`info-${idx}`}
                className={
                  idx !== INFO_ROWS.length - 1
                    ? "border-b border-[color:var(--border)]"
                    : ""
                }
              >
                <td className="px-6 py-3.5">
                  <span className="text-sm text-[color:var(--foreground)]">
                    {row.name}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <ValueCell value={row.cloud} />
                </td>
                <td className="px-6 py-3.5 text-center">
                  <ValueCell value={row.selfHosted} />
                </td>
              </tr>
            ))}

            {/* Feature categories */}
            {FEATURE_CATEGORIES.map((category, catIdx) => (
              <Fragment key={catIdx}>
                <tr className="border-t border-[color:var(--border)] bg-[color:var(--muted)]">
                  <td colSpan={3} className="px-6 py-3">
                    <span className="text-sm font-semibold text-[color:var(--foreground)]">
                      {category.name}
                    </span>
                  </td>
                </tr>
                {category.features.map((feature, featureIdx) => (
                  <tr
                    key={`${catIdx}-${featureIdx}`}
                    className={`transition-colors hover:bg-[color:var(--muted)] ${
                      featureIdx !== category.features.length - 1
                        ? "border-b border-[color:var(--border)]"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-[color:var(--foreground)]">
                        {feature.name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ValueCell value={feature.cloud} />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ValueCell value={feature.selfHosted} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-2 border-b border-[color:var(--border)] bg-[color:var(--muted)] px-4 py-3">
            <div className="text-center text-xs font-semibold text-[color:var(--foreground)]">
              Cloud
            </div>
            <div className="text-center text-xs font-semibold text-[color:var(--foreground)]">
              Self-Hosted
            </div>
          </div>

          {/* Info rows mobile */}
          <div className="border-b border-[color:var(--border)]">
            {INFO_ROWS.map((row, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 ${idx !== INFO_ROWS.length - 1 ? "border-b border-[color:var(--border)]" : ""}`}
              >
                <div className="text-sm font-medium text-[color:var(--foreground)] mb-2">
                  {row.name}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <ValueCell value={row.cloud} />
                  <ValueCell value={row.selfHosted} />
                </div>
              </div>
            ))}
          </div>

          {/* Feature categories mobile */}
          {FEATURE_CATEGORIES.map((category, catIdx) => (
            <div
              key={catIdx}
              className="border-b border-[color:var(--border)] last:border-b-0"
            >
              <div className="bg-[color:var(--muted)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                  {category.name}
                </h3>
              </div>
              {category.features.map((feature, featureIdx) => (
                <div
                  key={featureIdx}
                  className={`px-4 py-3 ${featureIdx !== category.features.length - 1 ? "border-b border-[color:var(--border)]" : ""}`}
                >
                  <div className="text-sm text-[color:var(--foreground)] mb-2">
                    {feature.name}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <ValueCell value={feature.cloud} />
                    <ValueCell value={feature.selfHosted} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
