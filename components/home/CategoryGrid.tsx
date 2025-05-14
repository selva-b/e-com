'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image?: string;
}

const placeholderCategories = [
  {
    id: '1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest tech and gadgets',
    image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600'
  },
  {
    id: '2',
    name: 'Clothing',
    slug: 'clothing',
    description: 'Stylish apparel for all seasons',
    image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=600'
  },
  {
    id: '3',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Everything for your living space',
    image: 'https://images.pexels.com/photos/1358900/pexels-photo-1358900.jpeg?auto=compress&cs=tinysrgb&w=600'
  },
  {
    id: '4',
    name: 'Beauty',
    slug: 'beauty',
    description: 'Premium beauty and personal care',
    image: 'https://images.pexels.com/photos/2693644/pexels-photo-2693644.jpeg?auto=compress&cs=tinysrgb&w=600'
  },
  {
    id: '5',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Complete your look with our accessories',
    image: 'https://images.pexels.com/photos/9978707/pexels-photo-9978707.jpeg?auto=compress&cs=tinysrgb&w=600'
  },
  {
    id: '6',
    name: 'Sports',
    slug: 'sports',
    description: 'Equipment and apparel for active lifestyles',
    image: 'https://images.pexels.com/photos/4761792/pexels-photo-4761792.jpeg?auto=compress&cs=tinysrgb&w=600'
  }
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>(placeholderCategories);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*');

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Map the data to include images (in a real app, you'd store image URLs in your database)
          const categoriesWithImages = data.map((category, index) => ({
            ...category,
            image: placeholderCategories[index % placeholderCategories.length].image
          }));
          setCategories(categoriesWithImages);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Keep using placeholder data if there's an error
      }
    }

    fetchCategories();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link
          href={`/categories/${category.slug}`}
          key={category.id}
          className="group overflow-hidden rounded-lg relative h-64"
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${category.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h3 className="text-xl font-bold mb-1">{category.name}</h3>
            <p className="text-sm text-white/80">{category.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
