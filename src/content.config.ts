import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pricingSchema = z.object({
  type: z.enum(['free', 'freemium', 'earn', 'paid', 'contact']),
  amount: z.number().optional(),
  label: z.string(),
  note: z.string().optional(),
});

const actionSchema = z.object({
  type: z.enum(['unyt_app', 'external_link', 'download', 'contact_form']),
  label: z.string(),
  url: z.string().optional(),
});

const specsSchema = z.object({
  cpu: z.string(),
  ram: z.string(),
  storage: z.string(),
  bandwidth: z.string().optional(),
  location: z.string(),
  rating: z.number().optional(),
}).optional();

const products = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    provider: z.enum(['holo', 'holochain', 'unyt', 'coasys', 'mycelium']),
    description: z.string(),
    longDescription: z.string().optional(),
    tags: z.array(z.string()),
    category: z.enum([
      'hosting', 'social', 'developer_tools', 'currency',
      'networking', 'ai', 'infrastructure',
    ]),
    status: z.enum(['available', 'beta', 'coming_soon']).default('available'),
    pricing: pricingSchema,
    action: actionSchema,
    featured: z.boolean().default(false),
    specs: specsSchema,
    sortOrder: z.number().default(100),
  }),
});

const providers = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/providers' }),
  schema: z.object({
    name: z.string(),
    color: z.string(),
    description: z.string(),
    logo: z.string().optional(),
    website: z.string().url().optional(),
    contact: z.string().optional(),
    sortOrder: z.number().default(100),
  }),
});

export const collections = { products, providers };
