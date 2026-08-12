interface Props {
  title: string;
  status: boolean;
}

export default function AnalysisItem({
  title,
  status,
}: Props) {
  return (
    <div className="analysis-item">
      <span>{title}</span>

      <span>
        {status ? "✅" : "❌"}
      </span>
    </div>
  );
}