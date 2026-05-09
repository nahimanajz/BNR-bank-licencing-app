'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Button } from './Button';

export const Nav = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const links = [
    { href: '/applications', label: 'Applications' },
    ...(user?.role === UserRole.REVIEWER || user?.role === UserRole.APPROVER
      ? [{ href: '/audit', label: 'Audit Log' }]
      : []),
  ];

  return (
    <nav className="bg-bnr-dark text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-8">
        <span className="font-bold text-lg tracking-wide text-teal-400">BNR Licensing</span>
        <div className="flex gap-4">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname.startsWith(href)
                  ? 'text-teal-400 font-semibold'
                  : 'text-gray-300 hover:text-bnr-teal'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400">
          {user?.email}{' '}
          <span className="ml-1 bg-bnr-gold text-bnr-dark text-xs font-semibold px-2 py-0.5 rounded-full">
            {user?.role}
          </span>
        </span>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-xs border-gray-500 text-gray-300 hover:text-white hover:border-white"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
};
