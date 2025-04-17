export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto p-4 w-full">
      {children}
    </div>
  );
} 