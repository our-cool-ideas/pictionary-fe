/** Shape of GET /categories (public) — trimmed, not the full admin Category. */
export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}
