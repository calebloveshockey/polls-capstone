'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './Loading';

export default function RerouteToHome() {
  const router = useRouter();

  useEffect(() => {
    router.push("/home");
  })

  return (
    <Loading/>
  )
}

export { RerouteToHome };
