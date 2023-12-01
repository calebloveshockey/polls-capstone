'use client'

import { logout } from '@/actions/actions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './Loading';

export default function Logout() {
  const router = useRouter();

  // Calls server action to logout then returns to home page
  useEffect(() => {
    logout();
    router.push("/home");
  })

  return (
    <Loading/>
  )
}

export { Logout };
