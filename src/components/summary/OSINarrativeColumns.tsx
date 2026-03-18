interface OSINarrativeColumnsProps {
  context: string;
  challenge: string;
  request: string;
}

export function OSINarrativeColumns({
  context,
  challenge,
  request,
}: OSINarrativeColumnsProps) {
  return (
    <div data-page-break-before className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
        <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-3">
          Context
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
          {context}
        </p>
      </div>
      <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
        <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-3">
          Challenge
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
          {challenge}
        </p>
      </div>
      <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
        <h4 className="text-[10px] font-bold text-navy uppercase tracking-widest mb-3">
          Request
        </h4>
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
          {request}
        </p>
      </div>
    </div>
  );
}
