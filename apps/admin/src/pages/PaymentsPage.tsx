import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentsApi } from "@/api/payments";
import type { PaymentDto } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Table, Pagination, type Column } from "@/components/ui/Table";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const GATEWAY_OPTIONS = [
  { label: "Stripe", value: "Stripe" },
  { label: "Paystack", value: "Paystack" },
];

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Succeeded", value: "Succeeded" },
  { label: "Failed", value: "Failed" },
  { label: "Refunded", value: "Refunded" },
];

const PURPOSE_OPTIONS = [
  { label: "Booking Deposit", value: "BookingDeposit" },
  { label: "Subscription", value: "Subscription" },
  { label: "Payout", value: "Payout" },
];

const PAGE_SIZE = 20;

export default function PaymentsPage() {
  const [gateway, setGateway] = useState("");
  const [status, setStatus] = useState("");
  const [purpose, setPurpose] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["payments", { page, gateway, status, purpose }],
    queryFn: () =>
      paymentsApi.list({
        page,
        pageSize: PAGE_SIZE,
        gateway: (gateway as PaymentDto["gateway"]) || undefined,
        status: (status as PaymentDto["status"]) || undefined,
        purpose: purpose || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<PaymentDto>[] = [
    { header: "Reference", accessor: (row) => row.gatewayReference },
    {
      header: "Provider",
      accessor: (row) => row.providerBusinessName ?? row.providerId ?? "—",
    },
    { header: "Purpose", accessor: (row) => <Badge tone="slate">{row.purpose}</Badge> },
    { header: "Gateway", accessor: (row) => row.gateway },
    { header: "Amount", accessor: (row) => formatCurrency(row.amount, row.currency) },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
    { header: "Date", accessor: (row) => formatDate(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select
            placeholder="All gateways"
            options={GATEWAY_OPTIONS}
            value={gateway}
            onChange={(e) => {
              setGateway(e.target.value);
              setPage(1);
            }}
          />
          <Select
            placeholder="All purposes"
            options={PURPOSE_OPTIONS}
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setPage(1);
            }}
          />
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
          emptyMessage="No payments match your filters"
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
