interface ContentLayerEntry {
  id: string;
}

export function getPostSlug(post: ContentLayerEntry): string {
  return post.id.split('/').pop()?.replace(/\.(?:md|mdx)$/i, '') ?? post.id;
}
