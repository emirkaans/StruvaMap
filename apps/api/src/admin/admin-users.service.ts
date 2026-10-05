import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import { fetchAll } from '../common/fetch-all';

/* Admin "Kullanıcılar" sayfası: uygulamadaki hesaplar (kayıtlı + misafir).
   Uygulamada kullanıcıya "yalnızca sen görürsün" denen içerik (ilişki adları,
   notlar, nabız cevapları, güvenlik sorusu) bilerek döndürülmez; yalnızca
   sayıları. */

export type AdminUserType = 'all' | 'registered' | 'guest';
export type PulseStatus = 'none' | 'pending' | 'active' | 'ended';

export interface AdminUserRow {
  id: string;
  username: string | null; // misafirde null
  guest: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  resultCount: number;
  pulse: PulseStatus;
  relationshipCount: number;
  hasPushToken: boolean;
}

export interface AdminUserDetail extends AdminUserRow {
  results: {
    id: string;
    testId: string;
    createdAt: string;
    rsi: number | null;
  }[];
  pulseDetail: {
    status: PulseStatus;
    acceptedAt: string | null;
    endedAt: string | null;
    checkinDays: number;
    ownAnsweredDays: number;
    bothAnsweredDays: number;
  };
  counts: {
    activeRelationships: number;
    archivedRelationships: number;
    notes: number;
    labourEntries: number;
    predictions: number;
  };
}

export interface AdminUserListQuery {
  page: number;
  pageSize: number;
  q?: string;
  type?: AdminUserType;
  sort?: 'newest' | 'oldest';
}

interface PairRow {
  id: string;
  user_id_a: string;
  user_id_b: string | null;
  status: 'pending' | 'active' | 'ended';
  created_at: string;
  accepted_at: string | null;
  ended_at: string | null;
}

// Birden fazla eşleşmesi olabilir (biten + yeni); en anlamlısı gösterilir.
const PULSE_PRIORITY: PulseStatus[] = ['active', 'pending', 'ended', 'none'];

@Injectable()
export class AdminUsersService {
  constructor(private readonly supabase: SupabaseService) {}

  async list(
    query: AdminUserListQuery,
  ): Promise<{ rows: AdminUserRow[]; total: number }> {
    const [users, usernames] = await Promise.all([
      this.allUsers(),
      this.usernames(),
    ]);
    const needle = query.q?.trim().toLowerCase();

    const filtered = users
      .filter((u) => {
        const guest = u.is_anonymous === true;
        if (query.type === 'registered' && guest) return false;
        if (query.type === 'guest' && !guest) return false;
        if (!needle) return true;
        const name = usernames.get(u.id) ?? '';
        return name.toLowerCase().includes(needle) || u.id.startsWith(needle);
      })
      .sort((a, b) =>
        query.sort === 'oldest'
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at),
      );

    const start = (query.page - 1) * query.pageSize;
    const page = filtered.slice(start, start + query.pageSize);
    return {
      rows: await this.toRows(page, usernames),
      total: filtered.length,
    };
  }

  async detail(id: string): Promise<AdminUserDetail> {
    const { data, error } =
      await this.supabase.client.auth.admin.getUserById(id);
    if (error || !data.user)
      throw new NotFoundException('Kullanıcı bulunamadı.');
    const user = data.user;

    const [
      usernames,
      results,
      pairs,
      relationships,
      notes,
      labour,
      predictions,
    ] = await Promise.all([
      this.usernames([id]),
      fetchAll<{
        id: string;
        test_id: string;
        created_at: string;
        score: { rsi?: number };
      }>((start, end) =>
        this.supabase.client
          .from('results')
          .select('id, test_id, created_at, score')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(start, end),
      ),
      this.pairsOf([id]),
      fetchAll<{ archived_at: string | null }>((start, end) =>
        this.supabase.client
          .from('relationships')
          .select('archived_at')
          .eq('user_id', id)
          .order('id')
          .range(start, end),
      ),
      this.countWhere('relationship_notes', 'user_id', id),
      this.countWhere('labour_entries', 'user_id', id),
      this.countWhere('predictions', 'user_id', id),
    ]);

    const [row] = await this.toRows([user], usernames);
    const pair = this.mainPair(pairs, id);
    return {
      ...row,
      results: results.map((r) => ({
        id: r.id,
        testId: r.test_id,
        createdAt: r.created_at,
        rsi: r.score?.rsi ?? null,
      })),
      pulseDetail: await this.pulseDetail(pair, id),
      counts: {
        activeRelationships: relationships.filter((r) => !r.archived_at).length,
        archivedRelationships: relationships.filter((r) => r.archived_at)
          .length,
        notes,
        labourEntries: labour,
        predictions,
      },
    };
  }

  private async allUsers(): Promise<User[]> {
    const perPage = 1000;
    const users: User[] = [];
    for (let page = 1; ; page++) {
      const { data, error } = await this.supabase.client.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new InternalServerErrorException(error.message);
      users.push(...data.users);
      if (data.users.length < perPage) return users;
    }
  }

  // Kullanıcı adı profiles tablosunda; misafirin profili yoktur.
  private async usernames(ids?: string[]): Promise<Map<string, string>> {
    const rows = await fetchAll<{ id: string; username: string }>(
      (start, end) => {
        let query = this.supabase.client
          .from('profiles')
          .select('id, username');
        if (ids) query = query.in('id', ids);
        return query.order('id').range(start, end);
      },
    );
    return new Map(rows.map((r) => [r.id, r.username]));
  }

  private async toRows(
    users: User[],
    usernames: Map<string, string>,
  ): Promise<AdminUserRow[]> {
    if (users.length === 0) return [];
    const ids = users.map((u) => u.id);
    const [results, pairs, relationships, tokens] = await Promise.all([
      this.userIdsIn('results', 'id', ids),
      this.pairsOf(ids),
      this.userIdsIn('relationships', 'id', ids),
      this.userIdsIn('user_push_tokens', 'user_id', ids),
    ]);
    const countOf = (list: string[], id: string) =>
      list.filter((x) => x === id).length;

    return users.map((u) => {
      const guest = u.is_anonymous === true;
      return {
        id: u.id,
        username: guest
          ? null
          : (usernames.get(u.id) ??
            (u.user_metadata?.username as string | undefined) ??
            null),
        guest,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        resultCount: countOf(results, u.id),
        pulse: this.mainPair(pairs, u.id)?.status ?? 'none',
        relationshipCount: countOf(relationships, u.id),
        hasPushToken: tokens.includes(u.id),
      };
    });
  }

  // Verilen kullanıcılara ait satırların user_id değerleri (sayım için).
  // uniqueColumn: sayfalar kaymasın diye sıralamada eşitliği bozan sütun.
  private async userIdsIn(
    table: string,
    uniqueColumn: string,
    ids: string[],
  ): Promise<string[]> {
    const rows = await fetchAll<{ user_id: string }>((start, end) =>
      this.supabase.client
        .from(table)
        .select('user_id')
        .in('user_id', ids)
        .order(uniqueColumn)
        .range(start, end),
    );
    return rows.map((r) => r.user_id);
  }

  private async countWhere(
    table: string,
    column: string,
    value: string,
  ): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(column, value);
    if (error) throw new InternalServerErrorException(error.message);
    return count ?? 0;
  }

  private pairsOf(ids: string[]): Promise<PairRow[]> {
    const list = ids.join(',');
    return fetchAll<PairRow>((start, end) =>
      this.supabase.client
        .from('pulse_pairs')
        .select(
          'id, user_id_a, user_id_b, status, created_at, accepted_at, ended_at',
        )
        .or(`user_id_a.in.(${list}),user_id_b.in.(${list})`)
        .order('created_at', { ascending: false })
        .order('id')
        .range(start, end),
    );
  }

  private mainPair(pairs: PairRow[], userId: string): PairRow | undefined {
    const own = pairs.filter(
      (p) => p.user_id_a === userId || p.user_id_b === userId,
    );
    for (const status of PULSE_PRIORITY) {
      const match = own.find((p) => p.status === status);
      if (match) return match; // pairs zaten en yeni önce sıralı
    }
    return undefined;
  }

  // Cevapların içeriği değil, yalnızca hangi günlerde cevap verildiği sayılır.
  private async pulseDetail(
    pair: PairRow | undefined,
    userId: string,
  ): Promise<AdminUserDetail['pulseDetail']> {
    if (!pair) {
      return {
        status: 'none',
        acceptedAt: null,
        endedAt: null,
        checkinDays: 0,
        ownAnsweredDays: 0,
        bothAnsweredDays: 0,
      };
    }
    const checkins = await fetchAll<{
      answer_a: number | null;
      answer_b: number | null;
    }>((start, end) =>
      this.supabase.client
        .from('pulse_checkins')
        .select('answer_a, answer_b')
        .eq('pair_id', pair.id)
        .order('id')
        .range(start, end),
    );
    const isA = pair.user_id_a === userId;
    return {
      status: pair.status,
      acceptedAt: pair.accepted_at,
      endedAt: pair.ended_at,
      checkinDays: checkins.length,
      ownAnsweredDays: checkins.filter((c) =>
        isA ? c.answer_a != null : c.answer_b != null,
      ).length,
      bothAnsweredDays: checkins.filter(
        (c) => c.answer_a != null && c.answer_b != null,
      ).length,
    };
  }
}
