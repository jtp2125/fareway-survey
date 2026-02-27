import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Grocery Shopping Survey
        </h1>
        <p className="text-gray-600">
          This survey is distributed through our panel partner.
          If you received a link, please use that link to begin the survey.
        </p>
      </div>
      <Link href="/admin/login" className="mt-12 text-sm text-gray-400 hover:text-gray-600">
        Admin
      </Link>
    </div>
  );
}
