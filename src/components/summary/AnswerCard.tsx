interface AnswerCardProps {
  title: string;
  children: React.ReactNode;
}

export function AnswerCard({ title, children }: AnswerCardProps) {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white overflow-hidden">
      <div className="bg-navy px-5 py-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}
