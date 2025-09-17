'use server';
/**
 * @fileOverview A flow for suggesting new app features.
 *
 * - suggestFeatures - Suggests new features based on existing ones.
 * - SuggestFeaturesInput - The input type for the suggestFeatures function.
 * - SuggestFeaturesOutput - The return type for the suggestFeatures function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFeaturesInputSchema = z.object({
  currentFeatures: z
    .array(z.string())
    .describe('A list of the current features in the application.'),
});
export type SuggestFeaturesInput = z.infer<typeof SuggestFeaturesInputSchema>;

const FeatureSuggestionSchema = z.object({
    title: z.string().describe('A short, catchy title for the new feature.'),
    description: z.string().describe('A one or two sentence description of what the feature does and why it would be useful.'),
    icon: z.string().describe('A relevant icon name from the lucide-react library. For example: "Zap", "Globe", "PieChart".')
});

const SuggestFeaturesOutputSchema = z.object({
  features: z
    .array(FeatureSuggestionSchema)
    .describe('An array of new feature suggestions.'),
});
export type SuggestFeaturesOutput = z.infer<typeof SuggestFeaturesOutputSchema>;

export async function suggestFeatures(
  input: SuggestFeaturesInput
): Promise<SuggestFeaturesOutput> {
  return suggestFeaturesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFeaturesPrompt',
  input: {schema: SuggestFeaturesInputSchema},
  output: {schema: SuggestFeaturesOutputSchema},
  prompt: `You are a creative product manager for a mobile productivity app called "Sutradhaar".
Your goal is to brainstorm innovative and complementary new features for the app.

The app is an all-in-one Unit Converter, Calculator, and Notes application.

Here are the current features of the app:
{{#each currentFeatures}}
- {{this}}
{{/each}}

Based on these existing features, suggest 3-5 new, creative, and useful features that would enhance the app and make it more valuable to users.
For each suggestion, provide a title, a brief description, and a suitable icon name from the lucide-react library.
Ensure the suggestions are distinct from the existing features and offer new functionality.
Focus on ideas that blend productivity, utility, and modern technology (like AI).
`,
});

const suggestFeaturesFlow = ai.defineFlow(
  {
    name: 'suggestFeaturesFlow',
    inputSchema: SuggestFeaturesInputSchema,
    outputSchema: SuggestFeaturesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
