import * as z from 'zod';
import { translate } from '@/lib/i18n';

export const createTopicSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: translate('learn.create_topic.validation_name_min') })
    .max(100, { message: translate('learn.create_topic.validation_name_max') }),
  translation: z.string().optional(),
  description: z.string().optional(),
});

export type CreateTopicFormValues = z.infer<typeof createTopicSchema>;
