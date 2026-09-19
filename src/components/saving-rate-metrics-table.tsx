import type { MonthlySavingRate } from "@/lib/money/monthly";
import { formatPercent } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

type SavingRateMetricsTableProps = {
  saving: MonthlySavingRate;
  displayCurrency: string;
  formatDisplay: (amount: number) => string;
  formatIdr: (amount: number) => string;
  formatThb: (amount: number) => string;
  showPreviousBalanceHint?: boolean;
};

export function SavingRateMetricsTable({
  saving,
  displayCurrency,
  formatDisplay,
  formatIdr,
  formatThb,
  showPreviousBalanceHint = true,
}: SavingRateMetricsTableProps) {
  return (
    <>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Income</TableCell>
            <TableCell className="text-right">
              {formatDisplay(saving.income)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              Expense (excl. Goal & Investment)
            </TableCell>
            <TableCell className="text-right">
              {formatDisplay(saving.expense)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Investment</TableCell>
            <TableCell className="text-right">
              {formatDisplay(saving.investment)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">IDR account balance</TableCell>
            <TableCell className="text-right">
              {saving.idrBalance != null ? formatIdr(saving.idrBalance) : "—"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">THB account balance</TableCell>
            <TableCell className="text-right">
              {saving.thbBalance != null ? formatThb(saving.thbBalance) : "—"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              Total balance ({displayCurrency})
            </TableCell>
            <TableCell className="text-right">
              {saving.totalBalance != null
                ? formatDisplay(saving.totalBalance)
                : "—"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Save amount</TableCell>
            <TableCell className="text-right">
              {saving.saveAmount != null
                ? formatDisplay(saving.saveAmount)
                : "—"}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">
              Saving ratio
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                (Investment + save amount) ÷ income
              </span>
            </TableCell>
            <TableCell className="text-right">
              {saving.savingRatio != null
                ? formatPercent(saving.savingRatio)
                : "—"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      {showPreviousBalanceHint &&
      saving.saveAmount == null &&
      saving.totalBalance != null ? (
        <p className="text-sm text-muted-foreground">
          Save amount and saving ratio appear once the prior period balance is
          recorded as well.
        </p>
      ) : null}
    </>
  );
}
