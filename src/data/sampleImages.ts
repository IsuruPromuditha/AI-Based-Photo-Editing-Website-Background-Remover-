export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'portrait-woman',
    name: 'Studio Portrait',
    category: 'Portrait',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    description: 'Model on soft backdrop with hair strands',
  },
  {
    id: 'sneaker-product',
    name: 'Nike Sneaker',
    category: 'Product',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Red sneaker on neutral studio background',
  },
  {
    id: 'golden-retriever',
    name: 'Golden Pup',
    category: 'Animal',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
    description: 'Friendly dog with fur details',
  },
  {
    id: 'ceramic-coffee',
    name: 'Ceramic Cup',
    category: 'Object',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    description: 'White coffee cup on uniform tabletop',
  },
  {
    id: 'sports-car',
    name: 'Sports Car',
    category: 'Vehicle',
    url: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
    description: 'Yellow sports car on road background',
  },
];
