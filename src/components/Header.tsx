import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'

export const Header = () => {
  const { data: sessionData, status: sessionStatus } = useSession()
  if (sessionStatus === 'loading') return <div className='navbar bg-primary text-primary-content'> Loading...</div>
  return (
    <div className='navbar bg-primary text-primary-content'>
      <div className="flex-1 pl-5 text-3xl font-bold">
        {sessionData?.user?.name ? `Notes from ${sessionData.user.name}` : ""}
      </div>
      <div className='dropdown-end dropdown'>
        {
          sessionData?.user ? (<div onClick={() => void signOut()} className='flex justify-center items-center cursor-pointer'>
            <div className='mr-2 text-lg'> Sign out</div>
            <label
              tabIndex={0}
              className="btn-ghost btn-circle avatar btn flex flex-row w-190"
            >
              <div className='flex w-10 rounded-full'>
                <Image
                  src={sessionData?.user.image ?? ""}
                  alt={sessionData?.user.name ?? ""}
                  width={199}
                  height={990}
                />
              </div>
            </label>
          </div>
          ) : (
            <button
              className='btn-ghost round-btn btn'
              onClick={() => void signIn()}
            >
              Sign in
            </button>)
        }
      </div>
    </div>
  )
}