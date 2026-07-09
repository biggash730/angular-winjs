import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { providersApi } from "@/api/providers";
import type { ProviderSummary } from "@/api/types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, Pagination, type Column } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDateOnly } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const CATEGORY_OPTIONS = [
  { label: "Barber", value: "Barber" },
  { label: "Hairdresser", value: "Hairdresser" },
  { label: "Makeup Artist", value: "MakeupArtist" },
  { label: "Clinic", value: "Clinic" },
  { label: "Photographer", value: "Photographer" },
  { label: "Car Rental", value: "CarRental" },
  { label: "Other", value: "Other" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "true" },
  { label: "Suspended", value: "false" },
];

const PAGE_SIZE = 20;

export default function ProvidersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "providers",
      { page, search: debouncedSearch, category, status },
    ],
    queryFn: () =>
      providersApi.list({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: category || undefined,
        isActive: status === "" ? undefined : status === "true",
      }),
    placeholderData: keepPreviousData,
  });

  const columns: Column<ProviderSummary>[] = [
    {
      header: "Business",
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.businessName}</p>
          <p className="text-xs text-slate-400">/{row.slug}</p>
        </div>
      ),
    },
    { header: "Category", accessor: (row) => row.category },
    { header: "Email", accessor: (row) => row.email },
    {
      header: "Subscription",
      accessor: (row) =>
        row.subscriptionStatus ? (
          <StatusBadge status={row.subscriptionStatus} />
        ) : (
          <span className="text-xs text-slate-400">None</span>
        ),
    },
    {
      header: "Status",
      accessor: (row) => <StatusBadge status={row.isActive ? "Active" : "Failed"} />,
    },
    { header: "Joined", accessor: (row) => formatDateOnly(row.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="Search by business name or email"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            placeholder="All categories"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
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
          onRowClick={(row) => navigate(`/providers/${row.id}`)}
          isLoading={isLoading}
          emptyMessage="No providers match your filters"
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
