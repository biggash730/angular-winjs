import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { subscriptionsApi } from "@/api/subscriptions";
import type { SubscriptionDto, SubscriptionStatus } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, Pagination, type Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

const STATUS_OPTIONS = [
  { label: "Trialing", value: "Trialing" },
  { label: "Active", value: "Active" },
  { label: "Past Due", value: "PastDue" },
  { label: "Canceled", value: "Canceled" },
];

const PAGE_SIZE = 20;

export default function SubscriptionsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["subscriptions", { page, status }],
    queryFn: () =>
      subscriptionsApi.list({
        page,
        pageSize: PAGE_SIZE,
        status: (status as SubscriptionStatus) || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<SubscriptionDto>[] = [
    {
      header: "Provider",
      accessor: (row) => row.providerBusinessName ?? row.providerId,
    },
    { header: "Plan", accessor: (row) => row.planName ?? "Standard" },
    {
      header: "Price",
      accessor: (row) => formatCurrency(row.priceUsd ?? 5),
    },
    { header: "Gateway", accessor: (row) => row.gateway },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Renews / Ends",
      accessor: (row) => formatDateOnly(row.currentPeriodEnd),
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
          emptyMessage="No subscriptions match your filters"
        />
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
