import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      schema: z.object({}),
    }),
    blog: defineCollection({
      type: 'page',
      // content/ 直下からの相対パス指定
      source: 'blog/**',
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        tags: z.array(z.string()).optional(),
        draft: z.boolean().optional(),
        canonical: z.string().optional(),
        // New frontmatter fields (tools-first pivot)
        type: z.enum(['primer', 'guide', 'reference', 'news']).optional(),
        tool: z.string().optional(),
        audience: z.string().optional(),
        visibility: z.enum(['primer', 'archive', 'hidden']).optional(),
        robots: z.string().optional(),
      }),
    }),
  },
})
