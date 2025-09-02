'use server';

/**
 * @fileOverview A flow for parsing a natural language conversion query.
 *
 * - parseConversionQuery - Parses a string like "10 km to m" into structured data.
 * - ParseConversionQueryInput - The input type for the parseConversionQuery function.
 * - ParseConversionQueryOutput - The return type for the parseConversionQuery function.
 */

import {ai} from '@/ai/genkit';
import {conversionCategories} from '@/lib/conversions';
import {z} from 'genkit';

const categoryNames = conversionCategories.map(c => c.name);

const ParseConversionQueryInputSchema = z.object({
  query: z.string().describe('The natural language query to parse.'),
});
export type ParseConversionQueryInput = z.infer<
  typeof ParseConversionQueryInputSchema
>;

const ParseConversionQueryOutputSchema = z.object({
  value: z.number().describe('The numeric value to be converted.'),
  fromUnit: z.string().describe('The symbol of the unit to convert from.'),
  toUnit: z.string().describe('The symbol of the unit to convert to.'),
  category: z
    .enum(categoryNames as [string, ...string[]])
    .describe('The category of the conversion.'),
});
export type ParseConversionQueryOutput = z.infer<
  typeof ParseConversionQueryOutputSchema
>;

export async function parseConversionQuery(
  input: ParseConversionQueryInput
): Promise<ParseConversionQueryOutput> {
  return parseConversionQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseConversionQueryPrompt',
  input: {schema: ParseConversionQueryInputSchema},
  output: {schema: ParseConversionQueryOutputSchema},
  prompt: `You are an expert at parsing unit conversion queries.
  The user will provide a query string. Extract the numerical value, the source unit, and the target unit.
  Also, determine the correct conversion category from the available options.

  Available categories: ${categoryNames.join(', ')}

  The available units are:
  Length: m, km, cm, mm, mi, yd, ft, in, nmi, gaj
  Weight: kg, g, mg, t, lb, oz, q, tola, ratti
  Temperature: °C, °F, K
  Data: B, KB, MB, GB, TB, PB
  Time: s, min, h, d, wk
  Speed: m/s, km/h, mph, kn
  Area: m², km², mi², ft², in², ha, acre, bigha
  Volume: L, mL, gal, qt, pt, cup, fl-oz

  Query: {{{query}}}

  From the query, identify the value, the symbol for the 'from' unit, and the symbol for the 'to' unit. Determine the appropriate category for the conversion.
  If you cannot determine all the required information, make a best guess. For example if the user enters "10km", assume they want to convert it to a common unit like miles or meters.
  `,
});

const parseConversionQueryFlow = ai.defineFlow(
  {
    name: 'parseConversionQueryFlow',
    inputSchema: ParseConversionQueryInputSchema,
    outputSchema: ParseConversionQueryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
