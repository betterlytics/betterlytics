import SignOutButton from "@/components/SignOutButton";
import { LocaleText } from "@/components/locale/LocaleText";
import { LocaleSelect } from "./locale/LocaleSelect";

export default function Topbar() {

  return (
    <header className="flex items-center justify-end h-14 px-6 bg-white border-b border-gray-200">
      <LocaleText
        k="test"
        as="h1"
        className="text-2xl font-bold text-red-600"
      />
      <SignOutButton />
      <LocaleSelect />
    </header>
  );
} 