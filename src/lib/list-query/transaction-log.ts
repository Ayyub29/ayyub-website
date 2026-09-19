const PAGE_SIZE = 25;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type TransactionLogQuery = {
  from: string;
  to: string;
  page: number;
  pageSize: number;
  /** True when URL omits from/to and the default last-3-months window applies. */
  isDefaultRange: boolean;
};

export function defaultTransactionLogDateRange(now = new Date()): {
  from: string;
  to: string;
} {
  const to = toIsoDate(now);
  const fromDate = new Date(now);
  fromDate.setMonth(fromDate.getMonth() - 3);
  return { from: toIsoDate(fromDate), to };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) {
    return 1;
  }
  return n;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

export function parseTransactionLogQuery(
  searchParams: { from?: string; to?: string; page?: string },
  now = new Date(),
): TransactionLogQuery {
  const defaults = defaultTransactionLogDateRange(now);
  const page = parsePage(searchParams.page);
  const rawFrom = searchParams.from?.trim();
  const rawTo = searchParams.to?.trim();

  if (!rawFrom && !rawTo) {
    return {
      from: defaults.from,
      to: defaults.to,
      page,
      pageSize: PAGE_SIZE,
      isDefaultRange: true,
    };
  }

  if (
    !rawFrom ||
    !rawTo ||
    !isValidIsoDate(rawFrom) ||
    !isValidIsoDate(rawTo)
  ) {
    return {
      from: defaults.from,
      to: defaults.to,
      page,
      pageSize: PAGE_SIZE,
      isDefaultRange: true,
    };
  }

  let from = rawFrom;
  let to = rawTo;
  if (from > to) {
    [from, to] = [to, from];
  }

  return {
    from,
    to,
    page,
    pageSize: PAGE_SIZE,
    isDefaultRange: false,
  };
}

export function clampTransactionLogPage(
  page: number,
  totalCount: number,
  pageSize: number,
): number {
  if (totalCount <= 0) {
    return 1;
  }
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return Math.min(page, totalPages);
}

export function transactionLogHref(
  basePath: string,
  query: Pick<TransactionLogQuery, "from" | "to" | "isDefaultRange">,
  page: number,
): string {
  const params = new URLSearchParams();
  if (!query.isDefaultRange) {
    params.set("from", query.from);
    params.set("to", query.to);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function formatTransactionLogRangeLabel(
  from: string,
  to: string,
  isDefaultRange: boolean,
): string {
  if (isDefaultRange) {
    return `Last 3 months (${from} – ${to})`;
  }
  return `${from} – ${to}`;
}
