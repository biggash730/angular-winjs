namespace BookingSaas.Application.Common.Models;

/// <summary>Shape returned by every paginated list endpoint: {items, page, pageSize, total}.</summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int Total { get; init; }

    public static PagedResult<T> Create(IReadOnlyList<T> items, int page, int pageSize, int total) =>
        new() { Items = items, Page = page, PageSize = pageSize, Total = total };
}

/// <summary>Common paging inputs for list endpoints (?page=1&amp;pageSize=20).</summary>
public class PaginationQuery
{
    private int _page = 1;
    private int _pageSize = 20;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => 1,
            > 100 => 100,
            _ => value
        };
    }
}
