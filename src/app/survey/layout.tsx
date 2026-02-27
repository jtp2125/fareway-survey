import ProgressBar from '@/components/survey/ProgressBar';

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-sm">
        {children}
      </div>
    </div>
  );
}
