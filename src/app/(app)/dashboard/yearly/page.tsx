import { redirect } from "next/navigation";

type YearlyRedirectProps = {
  searchParams: Promise<{ year?: string }>;
};

export default async function DashboardYearlyRedirect({
  searchParams,
}: YearlyRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams({ view: "yearly" });
  if (params.year) {
    query.set("year", params.year);
  }
  redirect(`/dashboard?${query.toString()}`);
}
