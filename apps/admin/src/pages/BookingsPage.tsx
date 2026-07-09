import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { bookingsApi } from "@/api/bookings";
import type { BookingDto } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Pagination, type Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const STATUS_OPTIONS = [
  { label: "Pending Payment", value: "PendingPayment" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Completed", value: "Completed" },
  { label: "No Show", value: "NoShow" },
];

const PAGE_SIZE = 20;

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["bookings", { page, search: debouncedSearch, status, from, to }],
    queryFn: () =>
      bookingsApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: (status as BookingDto["status"]) || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<BookingDto>[] = [
    {
      header: "Client",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.clientName}</p>
          <p className="text-xs text-slate-400">{row.clientEmail}</p>
        </div>
      ),
    },
    {
      header: "Provider",
      accessor: (row) => row.providerBusinessName ?? row.providerId,
    },
    { header: "Service", accessor: (row) => row.serviceName ?? row.serviceId },
    { header: "Scheduled", accessor: (row) => formatDate(row.scheduledStart) },
    { header: "Price", accessor: (row) => formatCurrency(row.servicePrice) },
    {
      header: "Deposit",
      accessor: (row) => (
        <span>
          {formatCurrency(row.depositAmount)}{" "}
          {row.depositPaid ? (
            <span className="text-xs text-emerald-600">paid</span>
          ) : (
            <span className="text-xs text-amber-600">unpaid</span>
          )}
        </span>
      ),
    },
    { header: "Status", accessor: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search client name/email"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
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
          <Input
            type="date"
            label={undefined}
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
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
          emptyMessage="No bookings match your filters"
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
