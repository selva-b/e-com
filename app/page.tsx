import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Truck, Shield, Award, Clock } from 'lucide-react';
import ProductSlider from '@/components/products/ProductSlider';
import FeatureCard from '@/components/home/FeatureCard';
import CategoryGrid from '@/components/home/CategoryGrid';
import Banner from '@/components/home/Banner';
import FlashSaleTimer from '@/components/home/FlashSaleTimer';
import { getFlashSaleSettings } from '@/lib/services/settings-service';

export default async function Home() {
  // Fetch flash sale settings
  const {
    showFlashSaleSection,
    flashSaleSectionTitle,
    flashSaleSectionSubtitle
  } = await getFlashSaleSettings();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner */}
      <Banner />

      {/* Flash Sale Section - Only shown if enabled in admin settings */}
      {showFlashSaleSection && (
        <section className="py-12 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
          <div className="container px-4 mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col">
                <div className="flex items-center mb-2">
                  <h2 className="text-3xl font-bold text-red-600 dark:text-red-500">
                    {flashSaleSectionTitle}
                  </h2>
                  <span className="ml-3 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full animate-pulse">
                    {flashSaleSectionSubtitle}
                  </span>
                </div>
                <FlashSaleTimer />
              </div>
              <Button variant="ghost" asChild className="text-red-600 hover:text-red-700 hover:bg-red-100">
                <Link href="/flash-sale" className="flex items-center">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductSlider type="flash-sale" />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-12 bg-accent/20">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Truck className="h-6 w-6" />}
              title="Free Shipping"
              description="Free shipping on all orders over $50"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Secure Payment"
              description="100% secure payment methods"
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="24/7 Support"
              description="Dedicated support team available"
            />
            <FeatureCard
              icon={<Award className="h-6 w-6" />}
              title="Quality Guarantee"
              description="100% satisfaction guaranteed"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Button variant="ghost" asChild>
              <Link href="/products" className="flex items-center">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductSlider type="featured" />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our wide range of categories and find exactly what you're looking for
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <Button variant="ghost" asChild>
              <Link href="/products?sort=newest" className="flex items-center">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ProductSlider type="newest" />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white dark:bg-gray-800 dark:text-gray-100">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Newsletter</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new products,
            special offers, and exclusive deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-2 rounded-md text-foreground bg-white dark:bg-gray-700 dark:text-white"
            />
            <Button className="bg-blue-500 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-900">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}