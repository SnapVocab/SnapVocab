import * as z from 'zod';
import { translate } from '@/lib/i18n';

export const collectionFormSchema = z.object({
  name: z
    .string()
    .min(1, translate('validation.collection_name_required'))
    .min(2, translate('validation.collection_name_size'))
    .max(100, translate('validation.collection_name_size')),
  translation: z.string(),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;
