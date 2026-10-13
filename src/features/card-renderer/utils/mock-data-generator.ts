import type { BuilderField } from '../types';

export function getMockFieldValue(field: BuilderField): string {
  // If field already has a sample placeholder defined, use it
  if (field.samplePlaceholder && field.samplePlaceholder.trim()) {
    return field.samplePlaceholder.trim();
  }

  const role = field.semanticRole;
  const name = (field.attributeName || '').toLowerCase();
  const label = (field.fieldLabel || '').toLowerCase();

  // 1. Semantic role based mock data
  if (role === 'TARGET_WORD') {
    return 'perseverance';
  }
  if (role === 'DEFINITION') {
    return 'Persistence in doing something despite difficulty or delay in achieving success.';
  }
  if (role === 'NATIVE_TRANSLATION') {
    return 'sự kiên trì, bền bỉ';
  }
  if (role === 'EXAMPLE_SENTENCE') {
    return 'Through hard work and perseverance, she reached her goal.';
  }
  if (role === 'AUDIO') {
    return 'https://ssl.gstatic.com/dictionary/static/sounds/20200429/perseverance--_gb_1.mp3';
  }
  if (role === 'IMAGE') {
    return 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500';
  }

  // 2. Name / Label matching
  if (name.includes('ipa') || name.includes('phonetic') || label.includes('phiên âm')) {
    return '/ˌpɜː.sɪˈvɪə.rəns/';
  }
  if (name.includes('pos') || name.includes('part') || label.includes('loại từ')) {
    return 'noun';
  }
  if (name.includes('trans') || name.includes('nghĩa') || label.includes('nghĩa')) {
    return 'sự kiên trì, nhẫn nại';
  }
  if (name.includes('exam') || name.includes('ví dụ') || label.includes('ví dụ')) {
    return 'Medicine is a field requiring great perseverance.';
  }
  if (name.includes('synonym') || label.includes('đồng nghĩa')) {
    return 'persistence, dedication, tenacity';
  }
  if (name.includes('antonym') || label.includes('trái nghĩa')) {
    return 'laziness, apathy, weakness';
  }

  // Fallback
  return field.fieldLabel || field.attributeName || 'Sample text';
}
