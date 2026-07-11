using System.Text;
using System.Text.RegularExpressions;

namespace BookingSaas.Application.Common;

public static partial class SlugHelper
{
    /// <summary>Kebab-cases a business name: lowercase, non-alphanumeric runs become a single '-',
    /// leading/trailing '-' trimmed. e.g. "Jane's Hair Studio!" -> "janes-hair-studio".</summary>
    public static string Slugify(string input)
    {
        var normalized = input.Trim().ToLowerInvariant();
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            else sb.Append('-');
        }

        var collapsed = MultiDashRegex().Replace(sb.ToString(), "-").Trim('-');
        return string.IsNullOrEmpty(collapsed) ? "provider" : collapsed;
    }

    [GeneratedRegex("-{2,}")]
    private static partial Regex MultiDashRegex();
}
