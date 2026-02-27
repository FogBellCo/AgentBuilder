import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import { useSessionStore } from '@/store/session-store';
import { protectionLevels } from '@/data/protection-levels';
import type { GatherDetails, ProtectionLevel } from '@/types/decision-tree';

const dataTypeOptions = [
  'Spreadsheet / CSV',
  'Database / SQL',
  'Documents / PDFs',
  'API / Web Service',
  'Images / Media',
  'Other',
];

const dataSizeOptions = [
  { value: 'small', label: 'Small (under 1,000 rows)' },
  { value: 'medium', label: 'Medium (1,000 – 100,000 rows)' },
  { value: 'large', label: 'Large (100,000+ rows)' },
  { value: 'unknown', label: "Not sure" },
];

interface GatherDetailFormProps {
  protectionLevel: ProtectionLevel;
}

export function GatherDetailForm({ protectionLevel }: GatherDetailFormProps) {
  const navigate = useNavigate();
  const { gatherDetails, setGatherDetails } = useSessionStore();

  const levelInfo = protectionLevels[protectionLevel];

  const [dataTypes, setDataTypes] = useState<string[]>(gatherDetails?.dataType ?? []);
  const [sourceSystem, setSourceSystem] = useState(gatherDetails?.sourceSystem ?? '');
  const [dataSize, setDataSize] = useState(gatherDetails?.dataSize ?? '');
  const [additionalNotes, setAdditionalNotes] = useState(gatherDetails?.additionalNotes ?? '');

  const toggleDataType = (opt: string) => {
    setDataTypes((prev) =>
      prev.includes(opt) ? prev.filter((t) => t !== opt) : [...prev, opt],
    );
  };

  const handleSubmit = () => {
    const details: GatherDetails = {
      dataType: dataTypes,
      sourceSystem: sourceSystem.trim(),
      dataSize,
      additionalNotes: additionalNotes.trim(),
    };
    setGatherDetails(details);
    navigate('/pipeline');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl py-8"
    >
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4" style={{ color: levelInfo.color }} />
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: levelInfo.color }}
          >
            {levelInfo.level} — {levelInfo.label}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">
          Tell us more about your data
        </h2>
        <p className="text-sm text-gray-500">
          These details help us understand your data source and prepare accurate recommendations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Data Type (multi-select) */}
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Data Type
          </label>
          <p className="text-xs text-gray-400 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-2">
            {dataTypeOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleDataType(opt)}
                className={`rounded-lg border-2 px-4 py-2 text-xs font-medium transition-colors ${
                  dataTypes.includes(opt)
                    ? 'border-blue bg-blue/5 text-blue'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Source System */}
        <div>
          <label
            htmlFor="source-system"
            className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
          >
            Source System <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            id="source-system"
            type="text"
            value={sourceSystem}
            onChange={(e) => setSourceSystem(e.target.value)}
            placeholder="e.g., TritonLink, ServiceNow, Canvas, Banner"
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors"
          />
        </div>

        {/* Data Size */}
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
            Approximate Data Size
          </label>
          <div className="flex flex-wrap gap-2">
            {dataSizeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDataSize(dataSize === opt.value ? '' : opt.value)}
                className={`rounded-lg border-2 px-4 py-2 text-xs font-medium transition-colors ${
                  dataSize === opt.value
                    ? 'border-blue bg-blue/5 text-blue'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label
            htmlFor="gather-notes"
            className="block text-xs font-bold text-navy uppercase tracking-wider mb-2"
          >
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="gather-notes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Anything else about your data source that might be helpful..."
            maxLength={500}
            rows={3}
            className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue focus:outline-none transition-colors resize-none"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleSubmit}
          className="group flex items-center gap-3 rounded-lg bg-blue px-8 py-3 text-white font-medium tracking-wide uppercase text-sm hover:bg-navy transition-colors"
        >
          Continue
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}
