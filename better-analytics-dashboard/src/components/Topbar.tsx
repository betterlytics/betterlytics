import SignOutButton from "@/components/SignOutButton";

export default function Topbar() {
  return (
    <header className="flex items-center justify-end h-14 px-6 bg-sidebar border-b border-border">
      <SignOutButton />
    </header>
  );
} 