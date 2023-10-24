'use client'

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RerouteToHome() {
  const router = useRouter();

  useEffect(() => {
    router.push("/home");
  })

  return (
    <div>Placeholder</div>
  )
}

export { RerouteToHome };
