'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: "Summer Collection",
    subtitle: "New Arrivals | Limited Time Offer",
    description: "Discover our newest summer collection with exclusive designs and premium quality.",
    buttonText: "Shop Now",
    buttonLink: "/categories/summer",
    imageUrl: "https://images.pexels.com/photos/5709661/pexels-photo-5709661.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alignment: "left",
    overlayColor: "from-black/70 to-transparent"
  },
  {
    id: 2,
    title: "Premium Accessories",
    subtitle: "Elegant & Durable | Free Shipping",
    description: "Elevate your style with our collection of premium accessories designed for modern living.",
    buttonText: "Explore",
    buttonLink: "/categories/accessories",
    imageUrl: "https://images.pexels.com/photos/934063/pexels-photo-934063.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alignment: "right",
    overlayColor: "from-black/70 to-transparent"
  },
  {
    id: 3,
    title: "Luxury Home Collection",
    subtitle: "Transform Your Space | Exclusive Designs",
    description: "Enhance your living space with our curated selection of luxury home products.",
    buttonText: "Discover",
    buttonLink: "/categories/home",
    imageUrl: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    alignment: "center",
    overlayColor: "from-black/70 to-transparent"
  }
];

export default function Banner() {
  const [currentBanner, setCurrentBanner] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const banner = banners[currentBanner];
  
  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${banner.imageUrl})` }}
      />
      
      {/* Gradient Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlayColor}`} />
      
      {/* Content */}
      <div className="container relative h-full px-4 mx-auto flex items-center">
        <div 
          className={`max-w-xl text-white ${
            banner.alignment === 'right' 
              ? 'ml-auto text-right' 
              : banner.alignment === 'center' 
                ? 'mx-auto text-center' 
                : 'text-left'
          }`}
        >
          <span className="inline-block text-sm md:text-base uppercase tracking-wider mb-2 bg-primary/80 px-3 py-1 rounded">
            {banner.subtitle}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">
            {banner.title}
          </h1>
          <p className="mb-6 text-lg drop-shadow-md max-w-md">
            {banner.description}
          </p>
          <Button asChild size="lg">
            <Link href={banner.buttonLink} className="flex items-center">
              {banner.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentBanner(index)}
            className={`w-3 h-3 rounded-full ${
              currentBanner === index ? 'bg-primary' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
