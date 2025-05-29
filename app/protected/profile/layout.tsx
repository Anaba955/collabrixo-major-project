import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile | Collabrixo',
  description: 'View and edit your profile information',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 