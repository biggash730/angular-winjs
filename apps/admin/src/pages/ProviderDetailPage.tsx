import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from "lucide-react";
import { providersApi } from "@/api/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/utils";

export default function ProviderDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<
    "suspend" | "activate" | null
  >(null);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["providers", id],
    queryFn: () => providersApi.get(id),
    enabled: !!id,
  });

  const invalidateAfterMutation = () => {
    queryClient.invalidateQueries({ queryKey: ["providers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
  };

  const suspendMutation = useMutation({
    mutationFn: () => providersApi.suspend(id),
    onSuccess: invalidateAfterMutation,
    onSettled: () => setConfirmAction(null),
  });

  const activateMutation = useMutation({
    mutationFn: () => providersApi.activate(id),
    onSuccess: invalidateAfterMutation,
    onSettled: () => setConfirmAction(null),
  });

  if (isLoading) return <FullPageSpinner />;
  if (!provider) {
    return (
      <div className="text-center text-sm text-slate-500">
        Provider not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/providers")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to providers
        </button>
        {provider.isActive ? (
          <Button variant="danger" onClick={() => setConfirmAction("suspend")}>
            <Ban className="h-4 w-4" />
            Suspend provider
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setConfirmAction("activate")}>
            <CheckCircle2 className="h-4 w-4" />
            Activate provider
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-xl font-semibold text-brand-700">
              {provider.logoUrl ? (
                <img
                  src={provider.logoUrl}
                  alt={provider.businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                provider.businessName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {provider.businessName}
              </h2>
              <p className="text-sm text-slate-500">/{provider.slug}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={provider.isActive ? "Active" : "Failed"} />
                {provider.subscription && (
                  <StatusBadge status={provider.subscription.status} />
                )}
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Mail className="h-4 w-4" />
              {provider.email}
            </div>
            {provider.phone && (
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="h-4 w-4" />
                {provider.phone}
              </div>
            )}
            {provider.address && (
              <div className="flex items-center gap-2 text-slate-500 sm:col-span-2">
                <MapPin className="h-4 w-4" />
                {provider.address}
              </div>
            )}
          </dl>
        </div>
        {provider.bio && (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            {provider.bio}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 text-slate-500">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Wallet</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Available</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(
                  provider.wallet?.availableBalance ?? 0,
                  provider.wallet?.currency,
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Pending</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(
                  provider.wallet?.pendingBalance ?? 0,
                  provider.wallet?.currency,
                )}
              </span>
            </div>
          </div>
          {provider.subscription && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-500">
                Subscription
              </p>
              <div className="mt-2 flex items-center justify-between">
                <StatusBadge status={provider.subscription.status} />
                <span className="text-xs text-slate-400">
                  renews {formatDateOnly(provider.subscription.currentPeriodEnd)}
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {provider.services.length === 0 ? (
              <p className="p-5 text-sm text-slate-400">No services configured</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {provider.services.map((service) => (
                  <li
                    key={service.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {service.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {service.durationMinutes} min &middot;{" "}
                        {service.depositPercentage}% deposit
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(service.price)}
                      </p>
                      {!service.isActive && (
                        <span className="text-xs text-slate-400">Inactive</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {provider.recentBookings.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No bookings yet</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {provider.recentBookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {booking.clientName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(booking.scheduledStart)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">
                      {formatCurrency(booking.servicePrice)}
                    </span>
                    <StatusBadge status={booking.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={
          confirmAction === "suspend"
            ? "Suspend this provider?"
            : "Activate this provider?"
        }
        description={
          confirmAction === "suspend"
            ? "Their public booking page will be taken offline and they won't be able to accept new bookings until reactivated."
            : "Their public booking page will go live again and they can resume accepting bookings."
        }
        confirmLabel={confirmAction === "suspend" ? "Suspend" : "Activate"}
        tone={confirmAction === "suspend" ? "danger" : "primary"}
        isLoading={suspendMutation.isPending || activateMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() =>
          confirmAction === "suspend"
            ? suspendMutation.mutate()
            : activateMutation.mutate()
        }
      />
    </div>
  );
}
