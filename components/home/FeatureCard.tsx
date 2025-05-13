import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-background border rounded-lg p-6 flex flex-col items-center text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1">
      <div className="mb-4 p-3 bg-primary/10 rounded-full text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}