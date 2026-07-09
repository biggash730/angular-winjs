using System.Reflection;
using BookingSaas.Application.Admin;
using BookingSaas.Application.Auth;
using BookingSaas.Application.Availability;
using BookingSaas.Application.Bookings;
using BookingSaas.Application.Payments;
using BookingSaas.Application.Providers;
using BookingSaas.Application.Services;
using BookingSaas.Application.Subscriptions;
using BookingSaas.Application.Wallet;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace BookingSaas.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

        services.AddScoped<AuthService>();
        services.AddScoped<ProviderService>();
        services.AddScoped<ServicesService>();
        services.AddScoped<AvailabilityService>();
        services.AddScoped<BookingService>();
        services.AddScoped<PaymentsService>();
        services.AddScoped<SubscriptionService>();
        services.AddScoped<Wallet.WalletService>();
        services.AddScoped<AdminService>();

        return services;
    }
}
