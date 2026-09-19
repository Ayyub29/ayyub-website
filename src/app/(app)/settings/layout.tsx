import { SettingsNav } from "@/components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Settings</h1>
        <SettingsNav />
      </aside>
      <div>{children}</div>
    </div>
  );
}
