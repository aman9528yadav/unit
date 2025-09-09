
'use server';

/**
 * @fileOverview A flow for translating text into a specified language, including suggestions and examples.
 *
 * - translateText - Translates text to a target language and provides additional context.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The language to translate the text into (e.g., "Spanish", "French", "Hindi").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translatedText: z.string().describe('The translated text.'),
  suggestions: z.array(z.string()).describe('Alternative translations or suggestions for the user.').optional(),
  examples: z.array(z.object({
    original: z.string().describe('An example sentence using the original text.'),
    translated: z.string().describe('The translation of the example sentence.'),
  })).optional(),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


const prompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following text into {{targetLanguage}}.

Text to translate:
"{{text}}"

Provide the main translation in the 'translatedText' field.
Also, provide up to 3 alternative translations or suggestions in the 'suggestions' field.
Finally, provide 1-2 example sentences using the original text and their corresponding translations in the 'examples' field.
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}
