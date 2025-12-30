import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course, CoefficientPair } from '@/types/gpa';

interface AddCourseFormProps {
  onAdd: (course: Omit<Course, 'id'>) => void;
  onCancel: () => void;
}

const AddCourseForm = ({ onAdd, onCancel }: AddCourseFormProps) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [credits, setCredits] = useState('3');
  const [processScore, setProcessScore] = useState('');
  const [finalScore, setFinalScore] = useState('');
  const [coefficientPair, setCoefficientPair] = useState<CoefficientPair>('3-7');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code || !name || !processScore || !finalScore) return;

    onAdd({
      code: code.toUpperCase(),
      name,
      credits: parseInt(credits),
      processScore: parseFloat(processScore),
      finalScore: parseFloat(finalScore),
      coefficientPair,
    });

    // Reset form
    setCode('');
    setName('');
    setCredits('3');
    setProcessScore('');
    setFinalScore('');
    setCoefficientPair('3-7');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Input
          placeholder="Mã HP"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="uppercase"
          required
        />
        <Input
          placeholder="Tên học phần"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="lg:col-span-2"
          required
        />
        <Select value={credits} onValueChange={setCredits}>
          <SelectTrigger>
            <SelectValue placeholder="Tín chỉ" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <SelectItem key={c} value={c.toString()}>
                {c} TC
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Điểm QT"
          value={processScore}
          onChange={(e) => setProcessScore(e.target.value)}
          min="0"
          max="10"
          step="0.1"
          required
        />
        <Input
          type="number"
          placeholder="Điểm CK"
          value={finalScore}
          onChange={(e) => setFinalScore(e.target.value)}
          min="0"
          max="10"
          step="0.1"
          required
        />
      </div>
      
      <div className="flex items-center justify-between gap-3">
        <Select value={coefficientPair} onValueChange={(v) => setCoefficientPair(v as CoefficientPair)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Hệ số" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3-7">3 - 7 (30% - 70%)</SelectItem>
            <SelectItem value="4-6">4 - 6 (40% - 60%)</SelectItem>
            <SelectItem value="5-5">5 - 5 (50% - 50%)</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Hủy
          </Button>
          <Button type="submit" variant="gradient">
            <Check className="h-4 w-4 mr-1" />
            Thêm
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AddCourseForm;
