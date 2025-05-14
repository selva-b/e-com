import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CategoryNotFound() {
  return (
    <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
      <p className="mb-8">The category you're looking for doesn't exist.</p>
      <Button asChild>
        <Link href="/categories">Browse Categories</Link>
      </Button>
    </div>
  );
}
