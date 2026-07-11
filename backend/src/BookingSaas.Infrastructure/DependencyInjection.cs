using BookingSaas.Application.Common.Interfaces;
using BookingSaas.Domain.Entities;
using BookingSaas.Infrastructure.Identity;
using BookingSaas.Infrastructure.Payments;
using BookingSaas.Infrastructure.Payments.Paystack;
using BookingSaas.Infrastructure.Payments.Stripe;
using BookingSaas.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BookingSaas.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<BookingSaasDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default")));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<BookingSaasDbContext>());

        services.AddIdentityCore<AppUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<BookingSaasDbContext>()
            .AddDefaultTokenProviders();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<StripeSettings>(configuration.GetSection(StripeSettings.SectionName));
        services.Configure<PaystackSettings>(configuration.GetSection(PaystackSettings.SectionName));
        services.Configure<FrontendSettings>(configuration.GetSection(FrontendSettings.SectionName));

        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IPayoutProvider, StubPayoutProvider>();

        services.AddScoped<IPaymentGateway, StripeGateway>();

        services.AddHttpClient<PaystackGateway>((sp, client) =>
        {
            var settings = configuration.GetSection(PaystackSettings.SectionName).Get<PaystackSettings>() ?? new PaystackSettings();
            client.BaseAddress = new Uri(settings.BaseUrl);
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", settings.SecretKey);
        });
        services.AddScoped<IPaymentGateway>(sp => sp.GetRequiredService<PaystackGateway>());

        return services;
    }
}
