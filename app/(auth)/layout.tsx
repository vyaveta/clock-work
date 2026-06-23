import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const layout = ({children}: {children: React.ReactNode}) => {
  return (
    <div className="flex bg-muted min-h-svh items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Link href={"/"} className="flex items-center gap-2 self-center font-medium">
          <Image src="/logos/full-logo.svg" alt="clock-work" width={120} height={50} />
        </Link>
        {children}
      </div>
    </div>
  )
}

export default layout