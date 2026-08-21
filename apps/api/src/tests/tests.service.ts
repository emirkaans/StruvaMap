import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { TestDefinition } from '@struva/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { assertValidTestDefinition } from './assert-valid-test-definition';

interface TestRow {
  id: string;
  definition: TestDefinition;
  updated_at: string;
}

@Injectable()
export class TestsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listAll(): Promise<TestDefinition[]> {
    const { data, error } = await this.supabase.client.from('tests').select('definition');
    if (error) throw new InternalServerErrorException(error.message);
    return ((data ?? []) as Pick<TestRow, 'definition'>[]).map((row) => row.definition);
  }

  async getById(testId: string): Promise<TestDefinition> {
    const { data, error } = await this.supabase.client
      .from('tests')
      .select('definition')
      .eq('id', testId)
      .single();

    if (error || !data) throw new NotFoundException(`Test bulunamadı: ${testId}`);
    return (data as Pick<TestRow, 'definition'>).definition;
  }

  async update(testId: string, definition: unknown): Promise<TestDefinition> {
    assertValidTestDefinition(definition, testId);

    const { data, error } = await this.supabase.client
      .from('tests')
      .update({ definition, updated_at: new Date().toISOString() })
      .eq('id', testId)
      .select('definition')
      .single();

    if (error || !data) throw new NotFoundException(`Test bulunamadı: ${testId}`);
    return (data as Pick<TestRow, 'definition'>).definition;
  }
}
