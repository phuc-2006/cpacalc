import { Module } from '@/types/curriculum';
import { cn } from '@/lib/utils';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModuleId: string | null;
  onSelect: (moduleId: string) => void;
}

const ModuleSelector = ({ modules, selectedModuleId, onSelect }: ModuleSelectorProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {modules.map((mod) => {
        const isSelected = selectedModuleId === mod.id;
        return (
          <button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            className={cn(
              'relative rounded-xl border-2 p-4 text-left transition-all duration-200',
              'hover:shadow-md hover:border-primary/40',
              isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-card'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={cn(
                  'h-3 w-3 rounded-full border-2 transition-colors',
                  isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                )}
              >
                {isSelected && (
                  <div className="h-full w-full rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs font-mono text-muted-foreground">{mod.id}</span>
            </div>
            <p className={cn(
              'text-sm font-medium',
              isSelected ? 'text-primary' : 'text-foreground'
            )}>
              {mod.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mod.requiredCredits} TC • {mod.courses.length} môn
            </p>
          </button>
        );
      })}
    </div>
  );
};

export default ModuleSelector;
