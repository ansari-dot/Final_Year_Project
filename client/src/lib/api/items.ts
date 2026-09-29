import { http, paginated, request } from './client';
import type { ApiItem, ApiCategory } from './types';

export interface ItemFilters {
  q?: string;
  categoryId?: number | string;
  gender?: 'male' | 'female' | 'unisex';
  condition?: 'new' | 'like_new' | 'good' | 'fair';
  size?: string;
  color?: string;
  brand?: string;
  page?: number;
  limit?: number;
}

export interface CreateItemPayload {
  title: string;
  description?: string;
  categoryId: number;
  size: string;
  gender: 'male' | 'female' | 'unisex';
  condition: 'new' | 'like_new' | 'good' | 'fair';
  color?: string;
  brand?: string;
}

export const itemsApi = {
  list: (filters: ItemFilters = {}) => paginated<ApiItem>('/items', filters as Record<string, unknown>),
  search: (filters: ItemFilters = {}) => paginated<ApiItem>('/search', filters as Record<string, unknown>),
  nlpSearch: (query: string, page = 1, limit = 20) =>
    paginated<ApiItem>(`/nlp-search`, { q: query, page, limit }),
  byUser: (userId: string | number, page = 1, limit = 20) =>
    paginated<ApiItem>(`/items/user/${userId}`, { page, limit }),
  byId: (id: string | number) => http.get<ApiItem>(`/items/${id}`),

  create: (payload: CreateItemPayload, files: File[]) => {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
    });
    files.forEach((f) => fd.append('images', f));
    return http.upload<ApiItem>('/items', fd);
  },

  update: (id: string | number, payload: Partial<CreateItemPayload> & { isAvailable?: boolean }) =>
    http.put<ApiItem>(`/items/${id}`, payload),

  remove: (id: string | number) => http.delete(`/items/${id}`),

  addImages: (id: string | number, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return http.upload<ApiItem>(`/items/${id}/images`, fd);
  },

  deleteImage: (itemId: string | number, imgId: string | number) =>
    http.delete(`/items/${itemId}/images/${imgId}`),

  setPrimary: (itemId: string | number, imgId: string | number) =>
    request<ApiItem>(`/items/${itemId}/images/${imgId}/primary`, { method: 'PUT' }),

  visualSearch: (file: File, categoryId?: number | string) => {
    const fd = new FormData();
    fd.append('image', file);
    if (categoryId) fd.append('category_id', String(categoryId));
    return http.upload<{
      success: boolean;
      request_id: string;
      query_attributes: Record<string, any>;
      results: Array<any>;
    }>('/search/visual', fd);
  },
};


export const categoriesApi = {
  list: () => http.get<ApiCategory[]>('/categories'),
};
