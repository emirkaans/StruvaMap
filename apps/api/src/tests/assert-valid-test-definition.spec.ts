import { BadRequestException } from '@nestjs/common';
import { assertValidTestDefinition } from './assert-valid-test-definition';

interface ConditionalNote {
  contextQuestionId: string;
  whenValue: string;
  band: string;
  note: string;
}

interface MutableTestDef {
  id: string;
  name: string;
  indices: Record<string, unknown>;
  dimensions: Record<
    string,
    { index: string; conditionalNotes: ConditionalNote[] }
  >;
  questions: Array<{ id: number; dim: string }>;
}

function validDef(overrides: Record<string, unknown> = {}): MutableTestDef {
  return {
    id: 'romantic',
    name: 'Romantik İlişki',
    slug: 'romantik-iliski',
    subtitle: 'alt başlık',
    inviteCta: 'davet et',
    contextQuestions: [
      {
        id: 'role',
        text: 'Rolün nedir?',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      },
    ],
    indices: {
      guc: { id: 'guc', name: 'Güç', desc: 'açıklama' },
    },
    dimensions: {
      karar: {
        id: 'karar',
        name: 'Karar',
        short: 'krr',
        index: 'guc',
        interpretation: { yüksek: 'h', orta: 'o', düşük: 'd' },
        conditionalNotes: [
          {
            contextQuestionId: 'role',
            whenValue: 'a',
            band: 'yüksek',
            note: 'not',
          },
        ],
      },
    },
    questions: [
      {
        id: 1,
        dim: 'karar',
        type: 'likert',
        text: 'Soru metni',
        options: [{ label: 'Katılıyorum', score: 3 }],
      },
    ],
    ...overrides,
  };
}

describe('assertValidTestDefinition', () => {
  it('geçerli tanım için hata fırlatmaz', () => {
    expect(() =>
      assertValidTestDefinition(validDef(), 'romantic'),
    ).not.toThrow();
  });

  it('obje olmayan tanımı reddeder', () => {
    expect(() => assertValidTestDefinition('string', 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('id route ile eşleşmezse reddeder', () => {
    expect(() =>
      assertValidTestDefinition(validDef({ id: 'friendship' }), 'romantic'),
    ).toThrow(BadRequestException);
  });

  it('boş name reddeder', () => {
    expect(() =>
      assertValidTestDefinition(validDef({ name: '  ' }), 'romantic'),
    ).toThrow(BadRequestException);
  });

  it('boş indices reddeder', () => {
    expect(() =>
      assertValidTestDefinition(validDef({ indices: {} }), 'romantic'),
    ).toThrow(BadRequestException);
  });

  it('dimension geçersiz index referans ederse reddeder', () => {
    const def = validDef();
    def.dimensions.karar.index = 'olmayan';
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('question geçersiz dim referans ederse reddeder', () => {
    const def = validDef();
    def.questions[0].dim = 'olmayan';
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('question id tekrar edilirse reddeder', () => {
    const def = validDef();
    def.questions.push({ ...def.questions[0] });
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('conditionalNote tanımsız contextQuestionId referans ederse reddeder', () => {
    const def = validDef();
    def.dimensions.karar.conditionalNotes[0].contextQuestionId = 'olmayan';
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('conditionalNote whenValue contextQuestion seçeneklerinde yoksa reddeder', () => {
    const def = validDef();
    def.dimensions.karar.conditionalNotes[0].whenValue = 'yok';
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });

  it('conditionalNote geçersiz band değeri verirse reddeder', () => {
    const def = validDef();
    def.dimensions.karar.conditionalNotes[0].band = 'çok-yüksek';
    expect(() => assertValidTestDefinition(def, 'romantic')).toThrow(
      BadRequestException,
    );
  });
});
