'use client';

interface SignpostScreenProps {
  text: string;
  onContinue: () => void;
}

export default function SignpostScreen({ text, onContinue }: SignpostScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-signpost rounded-xl p-8 my-4">
      <div className="text-center max-w-lg">
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">{text}</p>
        <button onClick={onContinue} className="btn-primary">
          Continue
        </button>
      </div>
    </div>
  );
}
