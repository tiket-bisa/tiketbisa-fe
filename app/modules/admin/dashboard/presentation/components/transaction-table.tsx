import { useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Card } from "~/core/design-system/components";
import { STATUS_MAP } from "~/core/constants/transaction";
import { formatIDR } from "~/core/utils";
import type { Transaction } from "~/core/types";

interface TransactionTableProps {
  transactions: Transaction[];
  returnTo?: string;
}

export function TransactionTable({ transactions, returnTo = "/internal-tb/admin" }: TransactionTableProps) {
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openDetail = (id: string) => {
    setPendingId(id);
    navigate(`/internal-tb/admin/transactions/${id}?${new URLSearchParams({ returnTo }).toString()}`);
  };

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Pembeli</th>
              <th className="text-right px-4 py-3 font-medium">Total</th>
              <th className="text-center px-4 py-3 font-medium">Status</th>
              <th className="text-center px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const status = STATUS_MAP[tx.status];
              return (
                <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-text-secondary font-mono text-xs">{tx.id}</td>
                  <td className="px-4 py-3 text-text-primary">{tx.buyer_name}</td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(tx.total_price)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(tx.id)}
                      isLoading={pendingId === tx.id}
                      className="text-xs"
                    >
                      Detail
                    </Button>
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-text-tertiary">Tidak ada transaksi ditemukan</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
