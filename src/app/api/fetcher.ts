// api/fetcher.ts

const API_BASE_URL = "/api";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type FilterValue = string | number | boolean;

export type Operator = ">" | ">=" | "<" | "<=" | "!=" | "LIKE";

export type HavingOperator = ">" | ">=" | "<" | "<=" | "!=" | "=";

export interface ApiOptions {
  /** Filters (e.g., { status: 'active', user_id: 123, sub_time_is_null: true }) */
  filters?: Record<string, FilterValue>;
  /**
   * Operators for filters (e.g., { age: 'gt', price: 'lte' })
   * first filter then operator so filter color:green then operator color:!=
   */
  operators?: Record<string, Operator>;
  /** Column(s) to sort by */
  sortBy?: string | string[];
  /** Sort order ('asc' or 'desc') */
  order?: string | string[];
  /** Limit number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** If true, returns count instead of data */
  count?: boolean;
  /** Column(s) to group by */
  groupBy?: string | string[];
  /** Aggregation functions (e.g., { total: 'SUM(amount)', avg_price: 'AVG(price)' }) */
  aggregates?: Record<string, string>;
  /** HAVING clause filters (e.g., { total: 1000 }) */
  having?: Record<string, FilterValue>;
  /** Operators for HAVING filters (e.g., { total: '>' }) */
  havingOperators?: Record<string, HavingOperator>;
}

export interface ApiSuccessResult {
  success?: boolean;
  id?: string | number;
  [key: string]: unknown;
}

export interface CountResult {
  total: number;
  [key: string]: unknown;
}

export interface PagedResult<T = unknown> {
  data: T;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const OPERATOR_SUFFIX_MAP: Record<Operator, string> = {
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
  "!=": "ne",
  LIKE: "like",
};

const HAVING_OPERATOR_SUFFIX_MAP: Record<HavingOperator, string> = {
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
  "!=": "ne",
  "=": "eq",
};

/**
 * Main API fetch function with support for filtering, sorting, pagination, and grouping
 * @param table - Table name
 * @param method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param data - Data for POST, PUT, PATCH
 * @param id - ID for GET, DELETE, PUT, PATCH
 * @param options - Query options for GET requests
 */
export async function apiFetch<T = any>(
  table: string,
  method: HttpMethod,
  data: Record<string, unknown> | null = null,
  id: string | number | null = null,
  options: ApiOptions = {}
): Promise<T> {
  let url = `${API_BASE_URL}/${table}`;
  const params = new URLSearchParams();

  // Handle GET with ID
  if (id && method === "GET") {
    params.append("id", String(id));
  }

  // Handle GET with filters, sorting, pagination, and grouping
  if (method === "GET" && !id) {
    const {
      filters = {},
      operators = {},
      sortBy,
      order,
      limit,
      offset,
      count,
      groupBy,
      aggregates = {},
      having = {},
      havingOperators = {},
    } = options;

    // Add filters
    for (const [key, value] of Object.entries(filters)) {
      // Handle IS NULL checks (e.g., sub_time_is_null: true)
      if (key.endsWith("_is_null")) {
        params.append(key, String(value));
      }
      // Handle IS NOT NULL checks (e.g., sub_time_is_not_null: true)
      else if (key.endsWith("_is_not_null")) {
        params.append(key, String(value));
      }
      // Handle operators
      else {
        const operator = operators[key];
        if (operator) {
          // Convert operator to suffix (e.g., '>' becomes 'gt')
          const suffix = OPERATOR_SUFFIX_MAP[operator];
          params.append(`${key}_${suffix}`, String(value));
        } else {
          params.append(key, String(value));
        }
      }
    }

    // Add grouping
    if (groupBy) {
      params.append(
        "groupBy",
        Array.isArray(groupBy) ? groupBy.join(",") : groupBy
      );
    }

    // Add aggregates
    if (Object.keys(aggregates).length > 0) {
      // Send aggregates as JSON string
      params.append("aggregates", JSON.stringify(aggregates));
    }

    // Add HAVING clause filters
    if (Object.keys(having).length > 0) {
      for (const [key, value] of Object.entries(having)) {
        const operator = havingOperators[key];
        if (operator) {
          const suffix = HAVING_OPERATOR_SUFFIX_MAP[operator];
          params.append(`having_${key}_${suffix}`, String(value));
        } else {
          params.append(`having_${key}`, String(value));
        }
      }
    }

    // Add sorting
    if (sortBy) {
      params.append(
        "sortBy",
        Array.isArray(sortBy) ? sortBy.join(",") : sortBy
      );
      if (order) {
        params.append("order", Array.isArray(order) ? order.join(",") : order);
      }
    }

    // Add pagination
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));

    // Add count flag
    if (count) params.append("_count", "true");
  }

  // Handle DELETE, PUT, PATCH with ID
  if (id && (method === "DELETE" || method === "PUT" || method === "PATCH")) {
    params.append("id", String(id));
  }

  // Append query parameters to URL
  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Attach body for POST, PUT, and PATCH
  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      let message = `API call failed: ${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed?.error) {
          message += ` - ${parsed.error}`;
        }
      } catch (err) {
        if (text) {
          message += ` - ${text}`;
        }
      }
      throw new Error(message);
    }

    const result: ApiSuccessResult = await res.json();

    // If PUT/PATCH returns { success: true }, refetch the updated item
    if ((method === "PUT" || method === "PATCH") && result.success && id) {
      const refetchUrl = `${API_BASE_URL}/${table}?id=${id}`;
      const refetchRes = await fetch(refetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refetchRes.ok) {
        const updatedItem = await refetchRes.json();
        return updatedItem as T;
      }
    }

    // If POST returns { success: true, id: X }, refetch the created item
    if (method === "POST" && result.success && result.id) {
      const refetchUrl = `${API_BASE_URL}/${table}?id=${result.id}`;
      const refetchRes = await fetch(refetchUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (refetchRes.ok) {
        const newItem = await refetchRes.json();
        return newItem as T;
      }
    }

    return result as T;
  } catch (error) {
    console.error(`Error in ${method} for ${table}:`, error);
    throw error;
  }
}

/**
 * Helper function to get count of records
 */
export async function apiCount(
  table: string,
  filters: Record<string, FilterValue> = {},
  operators: Record<string, Operator> = {}
): Promise<CountResult> {
  return apiFetch<CountResult>(table, "GET", null, null, {
    filters,
    operators,
    count: true,
  });
}

/**
 * Helper function to get paginated results with total count
 */
export async function apiGetPage<T = unknown>(
  table: string,
  page = 1,
  pageSize = 10,
  options: Pick<ApiOptions, "filters" | "operators" | "sortBy" | "order"> = {}
): Promise<PagedResult<T>> {
  const offset = (page - 1) * pageSize;
  const { filters = {}, operators = {}, sortBy, order } = options;

  const [data, countResult] = await Promise.all([
    apiFetch<T>(table, "GET", null, null, {
      filters,
      operators,
      sortBy,
      order,
      limit: pageSize,
      offset,
    }),
    apiCount(table, filters, operators),
  ]);

  return {
    data,
    total: countResult.total,
    page,
    pageSize,
    totalPages: Math.ceil(countResult.total / pageSize),
  };
}

/**
 * Helper function for grouped queries with aggregations
 *
 * @example
 * const result = await apiGroupBy('orders', 'user_id', {
 *   total_sales: 'SUM(amount)',
 *   avg_order: 'AVG(amount)',
 *   order_count: 'COUNT(*)'
 * });
 *
 * const result = await apiGroupBy('orders', 'user_id', {
 *   total: 'SUM(amount)'
 * }, {
 *   having: { total: 1000 },
 *   havingOperators: { total: '>' }
 * });
 *
 * const result = await apiGroupBy('orders', 'category', {
 *   revenue: 'SUM(amount)',
 *   items: 'COUNT(*)'
 * }, {
 *   filters: { status: 'completed' },
 *   sortBy: 'revenue',
 *   order: 'desc',
 *   limit: 10
 * });
 */
export async function apiGroupBy<T = unknown>(
  table: string,
  groupBy: string | string[],
  aggregates: Record<string, string> = {},
  options: Pick<
    ApiOptions,
    | "filters"
    | "operators"
    | "having"
    | "havingOperators"
    | "sortBy"
    | "order"
    | "limit"
  > = {}
): Promise<T> {
  const {
    filters = {},
    operators = {},
    having = {},
    havingOperators = {},
    sortBy,
    order,
    limit,
  } = options;

  return apiFetch<T>(table, "GET", null, null, {
    groupBy,
    aggregates,
    filters,
    operators,
    having,
    havingOperators,
    sortBy,
    order,
    limit,
  });
}