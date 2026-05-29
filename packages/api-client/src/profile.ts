import { assertSupabaseAuthConfig, type SupabaseAuthConfig } from './auth';

export type UserProfile = {
  readonly createdAt: string;
  readonly email: string;
  readonly id: string;
  readonly locale: string;
};

export type HouseholdRole = 'member' | 'owner';

export type Household = {
  readonly createdAt: string;
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly role: HouseholdRole;
};

export type AuthenticatedUserContext = {
  readonly accessToken: string | undefined;
  readonly user: {
    readonly email?: string | null | undefined;
    readonly id: string;
  };
};

export type ProfileClientOptions = {
  readonly fetch?: typeof fetch | undefined;
};

export type UpdateUserProfileInput = {
  readonly locale: string;
};

export type EnsureUserProfileInput = {
  readonly deviceLocale?: string | readonly string[] | null | undefined;
};

export type UpdateHouseholdInput = {
  readonly name: string;
};

export type EnsureHouseholdInput = {
  readonly name?: string | undefined;
};

type DatabaseUserProfile = {
  readonly created_at: string;
  readonly email: string;
  readonly id: string;
  readonly locale: string;
};

type DatabaseHousehold = {
  readonly created_at: string;
  readonly id: string;
  readonly name: string;
  readonly owner_id: string;
};

type DatabaseHouseholdMember = {
  readonly household_id: string;
  readonly role: HouseholdRole;
  readonly user_id: string;
};

type QueryValue = boolean | number | string;

const userProfileSelect = 'id,email,locale,created_at';
const householdSelect = 'id,owner_id,name,created_at';
const householdMemberSelect = 'household_id,user_id,role';

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

function normaliseBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function encodeQuery(params: Record<string, QueryValue | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      query.set(key, String(value));
    }
  }

  return query.toString();
}

function firstRow<T>(rows: readonly T[]): T | undefined {
  return rows[0];
}

function normaliseLocale(value: string | null | undefined): string | undefined {
  const language = value?.trim().replace('_', '-').split('-')[0]?.toLowerCase();

  return language && /^[a-z]{2}$/.test(language) ? language : undefined;
}

export function resolveDeviceLocale(
  deviceLocale: string | readonly string[] | null | undefined,
): string {
  const candidates =
    typeof deviceLocale === 'string' || deviceLocale == null ? [deviceLocale] : deviceLocale;

  for (const candidate of candidates) {
    const locale = normaliseLocale(candidate);

    if (locale) {
      return locale;
    }
  }

  return 'de';
}

function mapUserProfile(row: DatabaseUserProfile): UserProfile {
  return {
    createdAt: row.created_at,
    email: row.email,
    id: row.id,
    locale: row.locale,
  };
}

function mapHousehold(row: DatabaseHousehold, role: HouseholdRole = 'owner'): Household {
  return {
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    ownerId: row.owner_id,
    role,
  };
}

export class SackerlProfileClient {
  private readonly anonKey: string;
  private readonly fetch: typeof fetch;
  private readonly restUrl: string;

  constructor(config: SupabaseAuthConfig, options: ProfileClientOptions = {}) {
    const resolvedConfig = assertSupabaseAuthConfig(config);

    this.anonKey = resolvedConfig.anonKey;
    this.fetch = options.fetch ?? fetch;
    this.restUrl = `${normaliseBaseUrl(resolvedConfig.url)}/rest/v1`;
  }

  async getMe(context: AuthenticatedUserContext): Promise<UserProfile | null> {
    const rows = await this.requestRows<DatabaseUserProfile>('users', context, {
      id: `eq.${context.user.id}`,
      limit: 1,
      select: userProfileSelect,
    });

    const row = firstRow(rows);

    return row ? mapUserProfile(row) : null;
  }

  async ensureMe(
    context: AuthenticatedUserContext,
    input: EnsureUserProfileInput = {},
  ): Promise<UserProfile> {
    const existingProfile = await this.getMe(context);

    if (existingProfile) {
      return existingProfile;
    }

    const rows = await this.requestRows<DatabaseUserProfile>(
      'users',
      context,
      { on_conflict: 'id', select: userProfileSelect },
      {
        body: {
          email: context.user.email ?? '',
          id: context.user.id,
          locale: resolveDeviceLocale(input.deviceLocale),
        },
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
      },
    );

    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('Unable to create user profile.', 500);
    }

    return mapUserProfile(row);
  }

  async updateMe(
    context: AuthenticatedUserContext,
    input: UpdateUserProfileInput,
  ): Promise<UserProfile> {
    const locale = resolveDeviceLocale(input.locale);
    const rows = await this.requestRows<DatabaseUserProfile>(
      'users',
      context,
      { id: `eq.${context.user.id}`, select: userProfileSelect },
      {
        body: { locale },
        method: 'PATCH',
        prefer: 'return=representation',
      },
    );

    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('User profile not found.', 404);
    }

    return mapUserProfile(row);
  }

  async getHousehold(context: AuthenticatedUserContext): Promise<Household | null> {
    const rows = await this.requestRows<DatabaseHousehold>('households', context, {
      limit: 1,
      owner_id: `eq.${context.user.id}`,
      select: householdSelect,
    });

    const row = firstRow(rows);

    return row ? mapHousehold(row) : null;
  }

  async ensureHousehold(
    context: AuthenticatedUserContext,
    input: EnsureHouseholdInput = {},
  ): Promise<Household> {
    const existingHousehold = await this.getHousehold(context);

    if (existingHousehold) {
      return existingHousehold;
    }

    await this.ensureMe(context);

    const householdRows = await this.requestRows<DatabaseHousehold>(
      'households',
      context,
      { select: householdSelect },
      {
        body: {
          name: input.name?.trim() || 'My household',
          owner_id: context.user.id,
        },
        method: 'POST',
        prefer: 'return=representation',
      },
    );

    const householdRow = firstRow(householdRows);

    if (!householdRow) {
      throw new ApiRequestError('Unable to create household.', 500);
    }

    await this.requestRows<DatabaseHouseholdMember>(
      'household_members',
      context,
      { select: householdMemberSelect },
      {
        body: {
          household_id: householdRow.id,
          role: 'owner',
          user_id: context.user.id,
        },
        method: 'POST',
        prefer: 'return=representation',
      },
    );

    return mapHousehold(householdRow);
  }

  async updateHousehold(
    context: AuthenticatedUserContext,
    input: UpdateHouseholdInput,
  ): Promise<Household> {
    const name = input.name.trim();

    if (!name) {
      throw new ApiRequestError('Household name is required.', 400);
    }

    const rows = await this.requestRows<DatabaseHousehold>(
      'households',
      context,
      { owner_id: `eq.${context.user.id}`, select: householdSelect },
      {
        body: { name },
        method: 'PATCH',
        prefer: 'return=representation',
      },
    );

    const row = firstRow(rows);

    if (!row) {
      throw new ApiRequestError('Household not found.', 404);
    }

    return mapHousehold(row);
  }

  private async requestRows<T>(
    table: string,
    context: AuthenticatedUserContext,
    query: Record<string, QueryValue | undefined>,
    init: {
      readonly body?: object | undefined;
      readonly method?: 'GET' | 'PATCH' | 'POST' | undefined;
      readonly prefer?: string | undefined;
    } = {},
  ): Promise<readonly T[]> {
    if (!context.accessToken) {
      throw new ApiRequestError('Missing auth access token.', 401);
    }

    const queryString = encodeQuery(query);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      apikey: this.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
    };

    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (init.prefer) {
      headers.Prefer = init.prefer;
    }

    const requestInit: RequestInit = {
      headers,
      method: init.method ?? 'GET',
    };

    if (init.body) {
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await this.fetch(`${this.restUrl}/${table}?${queryString}`, requestInit);

    if (!response.ok) {
      const message = await readErrorMessage(response);

      throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) {
      return [];
    }

    return (await response.json()) as readonly T[];
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { readonly message?: string | undefined };

    return data.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

export function createSackerlProfileClient(
  config: SupabaseAuthConfig,
  options?: ProfileClientOptions,
): SackerlProfileClient {
  return new SackerlProfileClient(config, options);
}
