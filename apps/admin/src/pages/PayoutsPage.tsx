import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { payoutsApi } from "@/api/payouts";
import type { PayoutRequestDto, PayoutStatus } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, Pagination, type Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Processing", value: "Processing" },
  { label: "Completed", value: "Completed" },
  { label: "Failed", value: "Failed" },
];

const PAGE_SIZE = 20;

interface PendingAction {
  payout: PayoutRequestDto;
  type: "approve" | "reject";
}

export default function PayoutsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["payouts", { page, status }],
    queryFn: () =>
      payoutsApi.list({
        page,
        pageSize: PAGE_SIZE,
        status: (status as PayoutStatus) || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["payouts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };

  const approveMutation = useMutation({
    mutationFn: (id: string) => payoutsApi.approve(id),
    onSuccess: invalidate,
    onSettled: () => setPendingAction(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => payoutsApi.reject(id),
    onSuccess: invalidate,
    onSettled: () => setPendingAction(null),
  });

  const columns: Column<PayoutRequestDto>[] = [
    {
      header: "Provider",
      accessor: (row) => row.providerBusinessName ?? row.providerId,
    },
    { header: "Method", accessor: (row) => row.method },
    { header: "Amount", accessor: (row) => formatCurrency(row.amount) },
    { header: "Fee", accessor: (row) => formatCurrency(row.feeAmount) },
    {
      header: "Net",
      accessor: (row) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.netAmount)}
        </span>
      ),
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Requested", accessor: (row) => formatDate(row.createdAt) },
    {
      header: "Actions",
      accessor: (row) =>
        row.status === "Pending" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setPendingAction({ payout: row, type: "approve" })}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setPendingAction({ payout: row, type: "reject" })}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card className={isFetching && !isLoading ? "opacity-70 transition-opacity" : "transition-opacity"}>
        <Table
          columns={columns}
          data={data?.items ?? []}
          keyField={(row) => row.id}
          isLoading={isLoading}
          emptyMessage="No payout requests match your filters"
        />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </Card>

      <ConfirmDialog
        isOpen={pendingAction !== null}
        title={
          pendingAction?.type === "approve"
            ? "Approve this payout?"
            : "Reject this payout?"
        }
        description={
          pendingAction
            ? `${pendingAction.payout.providerBusinessName ?? "This provider"} requested ${formatCurrency(pendingAction.payout.netAmount)} net via ${pendingAction.payout.method}.`
            : undefined
        }
        confirmLabel={pendingAction?.type === "approve" ? "Approve" : "Reject"}
        tone={pendingAction?.type === "approve" ? "primary" : "danger"}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === "approve") {
            approveMutation.mutate(pendingAction.payout.id);
          } else {
            rejectMutation.mutate(pendingAction.payout.id);
          }
        }}
      />
    </div>
  );
}
