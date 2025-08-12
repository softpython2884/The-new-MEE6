'use server';

import {
  suggestServerConfiguration,
  type SuggestServerConfigurationOutput,
} from '@/ai/flows/suggest-server-configuration';
import { z } from 'zod';

const formSchema = z.object({
  serverSize: z.string().min(1, 'Server size is required.'),
  serverActivity: z.string().min(1, 'Server activity is required.'),
  communityType: z.string().min(1, 'Community type is required.'),
});

export type FormState = {
  data: SuggestServerConfigurationOutput | null;
  error: string | null;
  success: boolean;
};

export async function getAiSuggestions(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = formSchema.safeParse({
    serverSize: formData.get('serverSize'),
    serverActivity: formData.get('serverActivity'),
    communityType: formData.get('communityType'),
  });

  if (!parsed.success) {
    return {
      data: null,
      error: parsed.error.errors.map((e) => e.message).join(', '),
      success: false,
    };
  }

  try {
    const result = await suggestServerConfiguration(parsed.data);
    return { data: result, error: null, success: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to generate suggestions: ${error}`,
      success: false,
    };
  }
}
