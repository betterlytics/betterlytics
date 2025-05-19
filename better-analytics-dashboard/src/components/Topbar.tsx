import SignOutButton from "@/components/SignOutButton";

export default function Topbar() {
  return (
    <header className="flex items-center justify-end h-14 px-6 bg-white border-b border-gray-200">
      <SignOutButton />
    </header>
  );
} 