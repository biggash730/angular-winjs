import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Settings as SettingsIcon } from "lucide-react";
import { settingsApi } from "@/api/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/Spinner";

const settingsSchema = z.object({
  subscriptionPriceUsd: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be zero or greater"),
  payoutFeePercentage: z.coerce
    .number({ invalid_type_error: "Enter a valid percentage" })
    .min(0, "Must be zero or greater")
    .max(100, "Must be 100 or less"),
  payoutFeeFixedUsd: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .min(0, "Must be zero or greater"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      subscriptionPriceUsd: 5,
      payoutFeePercentage: 2,
      payoutFeeFixedUsd: 0.3,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        subscriptionPriceUsd: data.subscriptionPriceUsd,
        payoutFeePercentage: data.payoutFeePercentage,
        payoutFeeFixedUsd: data.payoutFeeFixedUsd,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: SettingsFormValues) => settingsApi.update(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    },
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-slate-400" />
            Platform settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="space-y-5"
          >
            <Input
              label="Subscription price (USD / month)"
              type="number"
              step="0.01"
              min="0"
              error={errors.subscriptionPriceUsd?.message}
              {...register("subscriptionPriceUsd")}
            />
            <Input
              label="Payout fee percentage (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              error={errors.payoutFeePercentage?.message}
              {...register("payoutFeePercentage")}
            />
            <Input
              label="Payout fee fixed amount (USD)"
              type="number"
              step="0.01"
              min="0"
              error={errors.payoutFeeFixedUsd?.message}
              {...register("payoutFeeFixedUsd")}
            />

            <div className="flex items-center gap-3 border-t border-slate-100 pt-5">
              <Button
                type="submit"
                isLoading={mutation.isPending}
                disabled={!isDirty}
              >
                Save changes
              </Button>
              {showSuccess && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Settings saved
                </span>
              )}
              {mutation.isError && (
                <span className="text-sm text-red-600">
                  Failed to save settings. Please try again.
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
