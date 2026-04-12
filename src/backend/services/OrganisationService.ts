import skaftinClient from '@/backend/client/SkaftinClient';
import routes from '@/constants/ApiRoutes';
import useAuthStore from '@/stores/data/AuthStore';
import type {
  OrgJoinRequest,
  Organisation,
  OrganisationMemberDisplay,
  OrgTier,
} from '@/types/Types';

function generateJoinCode(): string {
  // Excludes visually ambiguous chars: 0, O, 1, I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

class OrganisationService {
  /** Assign the pro_user role to the current user via PUT /app-api/database/users/update. */
  async upgradeToPro(): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = useAuthStore.getState().user_id;
      const currentRoles = useAuthStore.getState().getRoles();
      const alreadyPro = currentRoles.some(r => r.role_key === 'pro_user');
      if (alreadyPro) return { success: true };

      // Build the full role_keys list (keep existing roles + add pro_user)
      const existingKeys = currentRoles.map(r => r.role_key);
      const role_keys = [...existingKeys, 'pro_user'];

      const res = await skaftinClient.put<Record<string, unknown>>(routes.auth.updateUser, {
        where: { user_id: userId },
        role_keys,
      });
      if (!res.success) {
        return { success: false, error: res.message ?? 'Failed to upgrade account' };
      }
      // Immediately update local roles so isPro() reflects the change without re-login
      useAuthStore.getState().updateUser({
        roles: [...currentRoles, { id: 3, role_key: 'pro_user', role_name: 'Pro User' }],
      });
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to upgrade account' };
    }
  }

  /** Create a new organisation. Retries join code generation on UNIQUE conflict (max 3 attempts). */
  async createOrganisation(payload: {
    name: string;
    tier: OrgTier;
    ownerUserId: number;
    vehicleLimit: number | null;
  }): Promise<{ success: boolean; data?: Organisation; error?: string }> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const join_code = generateJoinCode();
      try {
        const res = await skaftinClient.post<Record<string, unknown>>(routes.organisations.create, {
          data: {
            name: payload.name.trim(),
            owner_user_id: payload.ownerUserId,
            join_code,
            tier: payload.tier,
            vehicle_limit: payload.vehicleLimit,
          },
        });
        if (!res.success) {
          const msg = res.message ?? '';
          // Retry on duplicate join_code (UNIQUE constraint violation)
          if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')) {
            continue;
          }
          return { success: false, error: msg || 'Failed to create organisation' };
        }
        const row = (Array.isArray(res.data) ? res.data[0] : res.data) as Record<string, unknown>;
        if (!row?.id) return { success: false, error: 'Unexpected response from server' };
        return { success: true, data: rowToOrganisation(row) };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '';
        if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')) {
          continue;
        }
        return { success: false, error: msg || 'Failed to create organisation' };
      }
    }
    return { success: false, error: 'Failed to generate a unique join code. Please try again.' };
  }

  /** Update an existing organisation's name and/or tier. */
  async updateOrganisation(orgId: number, payload: {
    name?: string;
    tier?: OrgTier;
    vehicleLimit?: number | null;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.name !== undefined) data.name = payload.name.trim();
      if (payload.tier !== undefined) data.tier = payload.tier;
      if (payload.vehicleLimit !== undefined) data.vehicle_limit = payload.vehicleLimit;
      const res = await skaftinClient.put<Record<string, unknown>>(routes.organisations.update, {
        where: { id: orgId },
        data,
      });
      if (!res.success) {
        return { success: false, error: res.message ?? 'Failed to update organisation' };
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to update organisation' };
    }
  }

  /** Find an organisation by its 6-character join code. */
  async findOrgByJoinCode(code: string): Promise<Organisation | null> {
    try {
      const res = await skaftinClient.post<Record<string, unknown>[]>(routes.organisations.list, {
        where: { join_code: code.trim().toUpperCase() },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) return null;
      return rowToOrganisation(rows[0]);
    } catch {
      return null;
    }
  }

  /** Fetch the organisation owned by a user (for pro_user admins). */
  async fetchOwnedOrganisation(ownerUserId: number): Promise<Organisation | null> {
    try {
      const res = await skaftinClient.post<Record<string, unknown>[]>(routes.organisations.list, {
        where: { owner_user_id: ownerUserId },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) return null;
      return rowToOrganisation(rows[0]);
    } catch {
      return null;
    }
  }

  /** Fetch the approved join request for a regular user (to determine their org). */
  async fetchApprovedMembership(userId: number): Promise<OrgJoinRequest | null> {
    try {
      const res = await skaftinClient.post<Record<string, unknown>[]>(routes.orgJoinRequests.list, {
        where: { user_id: userId, status: 'approved' },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) return null;
      return rowToJoinRequest(rows[0]);
    } catch {
      return null;
    }
  }

  /** Submit a join request for a regular user. */
  async submitJoinRequest(payload: {
    organisationId: number;
    userId: number;
    userName?: string;
    userEmail?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Check for an existing pending request to avoid duplicates
      const existing = await skaftinClient.post<Record<string, unknown>[]>(routes.orgJoinRequests.list, {
        where: { organisation_id: payload.organisationId, user_id: payload.userId, status: 'pending' },
      });
      if (Array.isArray(existing.data) && existing.data.length > 0) {
        return { success: true }; // Already submitted
      }
      const res = await skaftinClient.post<Record<string, unknown>>(routes.orgJoinRequests.create, {
        data: {
          organisation_id: payload.organisationId,
          user_id: payload.userId,
          user_name: payload.userName ?? null,
          user_email: payload.userEmail ?? null,
          status: 'pending',
        },
      });
      if (!res.success) {
        return { success: false, error: res.message ?? 'Failed to submit request' };
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to submit request' };
    }
  }

  /** List pending join requests for an organisation (admin view). */
  async listPendingRequests(organisationId: number): Promise<OrgJoinRequest[]> {
    try {
      const res = await skaftinClient.post<Record<string, unknown>[]>(routes.orgJoinRequests.list, {
        where: { organisation_id: organisationId, status: 'pending' },
      });
      return Array.isArray(res.data) ? res.data.map(rowToJoinRequest) : [];
    } catch {
      return [];
    }
  }

  /** Approved join rows for an org (drivers only; owner is not duplicated here). */
  async listApprovedMembers(organisationId: number): Promise<OrgJoinRequest[]> {
    try {
      const res = await skaftinClient.post<Record<string, unknown>[]>(routes.orgJoinRequests.list, {
        where: { organisation_id: organisationId, status: 'approved' },
      });
      return Array.isArray(res.data) ? res.data.map(rowToJoinRequest) : [];
    } catch {
      return [];
    }
  }

  /**
   * Full member roster for an org admin: you (owner) plus approved drivers.
   * `ownerProfile` should reflect the signed-in admin (not stored on `organisations`).
   */
  async fetchOrganisationMemberRoster(
    org: Organisation,
    ownerProfile: { name: string; email?: string | null }
  ): Promise<OrganisationMemberDisplay[]> {
    const approved = await this.listApprovedMembers(org.id);
    const roster: OrganisationMemberDisplay[] = [
      {
        user_id: org.owner_user_id,
        user_name: ownerProfile.name,
        user_email: ownerProfile.email ?? undefined,
        role: 'admin',
      },
    ];
    for (const r of approved) {
      if (r.user_id === org.owner_user_id) continue;
      roster.push({
        user_id: r.user_id,
        user_name: r.user_name,
        user_email: r.user_email,
        role: 'driver',
        member_since: r.updated_at ?? r.created_at,
      });
    }
    return roster;
  }

  /** Approve a join request — updates its status. */
  async approveRequest(requestId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await skaftinClient.put<Record<string, unknown>>(routes.orgJoinRequests.update, {
        where: { id: requestId },
        data: { status: 'approved', updated_at: new Date().toISOString() },
      });
      if (!res.success) {
        return { success: false, error: res.message ?? 'Failed to approve request' };
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to approve request' };
    }
  }

  /** Reject a join request. */
  async rejectRequest(requestId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await skaftinClient.put<Record<string, unknown>>(routes.orgJoinRequests.update, {
        where: { id: requestId },
        data: { status: 'rejected', updated_at: new Date().toISOString() },
      });
      if (!res.success) {
        return { success: false, error: res.message ?? 'Failed to reject request' };
      }
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to reject request' };
    }
  }

  /**
   * Resolve the organisation_id for the current user:
   * - Pro users: check if they own an org
   * - Regular users: check if they have an approved join request
   * Returns the organisation_id or null.
   */
  async resolveOrganisationId(userId: number, isPro: boolean): Promise<number | null> {
    try {
      if (isPro) {
        const org = await this.fetchOwnedOrganisation(userId);
        return org?.id ?? null;
      } else {
        const membership = await this.fetchApprovedMembership(userId);
        return membership?.organisation_id ?? null;
      }
    } catch {
      return null;
    }
  }
}

function rowToOrganisation(row: Record<string, unknown>): Organisation {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    owner_user_id: Number(row.owner_user_id),
    join_code: String(row.join_code ?? ''),
    tier: (row.tier as OrgTier) ?? 'bronze',
    vehicle_limit: row.vehicle_limit != null ? Number(row.vehicle_limit) : null,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

function rowToJoinRequest(row: Record<string, unknown>): OrgJoinRequest {
  return {
    id: Number(row.id),
    organisation_id: Number(row.organisation_id),
    user_id: Number(row.user_id),
    user_name: row.user_name != null ? String(row.user_name) : undefined,
    user_email: row.user_email != null ? String(row.user_email) : undefined,
    status: (row.status as OrgJoinRequest['status']) ?? 'pending',
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

export const organisationService = new OrganisationService();
