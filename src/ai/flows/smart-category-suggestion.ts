// src/ai/flows/smart-category-suggestion.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting relevant conversion categories based on user input and past conversions.
 *
 * - suggestCategory - A function that takes user input and conversion history to suggest relevant categories.
 * - SuggestCategoryInput - The input type for the suggestCategory function.
 * - SuggestCategoryOutput - The return type for the suggestCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCategoryInputSchema = z.object({
  input: z.string().describe('The user input value or description.'),
  conversionHistory: z
    .array(z.string())
    .describe(
      'An array of strings representing the users recent conversion history.'
    )
    .optional(),
});
export type SuggestCategoryInput = z.infer<typeof SuggestCategoryInputSchema>;

const SuggestCategoryOutputSchema = z.object({
  suggestedCategories: z
    .array(z.string())
    .describe(
      'An array of suggested conversion categories based on the input and history.'
    ),
});
export type SuggestCategoryOutput = z.infer<typeof SuggestCategoryOutputSchema>;

export async function suggestCategory(input: SuggestCategoryInput): Promise<SuggestCategoryOutput> {
  return suggestCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryPrompt',
  input: {schema: SuggestCategoryInputSchema},
  output: {schema: SuggestCategoryOutputSchema},
  prompt: `You are a helpful assistant designed to suggest relevant conversion categories to the user.

Given the following user input:
{{input}}

And the users recent conversion history:
{{#if conversionHistory}}
  {{#each conversionHistory}}- {{this}}\n  {{/each}}
{{else}}
  No recent conversion history.
{{/if}}

Suggest a list of conversion categories that would be most relevant to the user. Return an array of strings.
`,
});

const suggestCategoryFlow = ai.defineFlow(
  {
    name: 'suggestCategoryFlow',
    inputSchema: SuggestCategoryInputSchema,
    outputSchema: SuggestCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
