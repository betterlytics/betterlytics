import { ThemeProvider } from "next-themes";
import { Footer } from "../components/footer";
import { BlogTopBar } from "./components/BlogTopBar";
import { BlogThemeFab } from "./components/BlogThemeFab";
import "./blog.css";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Mounts a `next-themes` ThemeProvider for the blog subtree (sibling to
    // Nextra's own ThemeProvider on /docs/*). Both default to attribute="class"
    // + storageKey="theme", matching the root layout boot script — so the
    // persistent state stays in sync across route navigation.
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="blog-root bg-background text-foreground flex min-h-screen flex-col">
        <BlogTopBar />
        <main className="flex-1">{children}</main>
        <Footer />
        <BlogThemeFab />
      </div>
    </ThemeProvider>
  );
}
