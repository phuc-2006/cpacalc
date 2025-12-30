import { cn } from '@/lib/utils';
import { getClassification, getClassificationColor } from '@/utils/gpaCalculator';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle: string;
  showClassification?: boolean;
  variant?: 'primary' | 'secondary';
}

const StatsCard = ({ title, value, subtitle, showClassification = false, variant = 'primary' }: StatsCardProps) => {
  const classification = getClassification(value);
  const colorClass = getClassificationColor(classification);

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 card-shadow-lg animate-scale-in",
        variant === 'primary' ? 'gradient-bg text-primary-foreground' : 'bg-card'
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-foreground/5" />
      <div className="absolute -right-2 -bottom-6 h-16 w-16 rounded-full bg-foreground/5" />
      
      <div className="relative">
        <p className={cn(
          "text-sm font-medium mb-1",
          variant === 'primary' ? 'text-primary-foreground/80' : 'text-muted-foreground'
        )}>
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-4xl font-bold tracking-tight",
            variant === 'secondary' && 'text-foreground'
          )}>
            {value.toFixed(2)}
          </span>
          <span className={cn(
            "text-sm",
            variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            / 4.00
          </span>
        </div>
        <p className={cn(
          "text-sm mt-1",
          variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {subtitle}
        </p>
        
        {showClassification && value > 0 && (
          <div className={cn(
            "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3",
            variant === 'primary' ? 'bg-primary-foreground/20' : colorClass
          )}>
            {classification}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
