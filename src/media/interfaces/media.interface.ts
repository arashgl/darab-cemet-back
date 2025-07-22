export interface MediaItem {
  id: string;
  type: 'gallery' | 'iframe' | 'url';
  title: string;
  description?: string;
  coverImage: string; // Thumbnail or preview
  url: string; // The actual link or source
  createdAt?: string;
  tags?: string[];
}

export interface MediaResponse {
  data: MediaItem[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}
