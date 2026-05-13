import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {

 const [isOpen, setIsOpen] = useState(false)
 const [isSearchOpen, setIsSearchOpen] = useState(false)
 const [searchTerm, setSearchTerm] = useState('')
 const {user} = useUser()
 const {openSignIn} = useClerk()

 const navigate = useNavigate()

 const {favoriteMovies} = useAppContext()

 const submitSearch = (event) => {
    event.preventDefault()

    const trimmedSearch = searchTerm.trim()
    setIsSearchOpen(false)
    setIsOpen(false)
    scrollTo(0, 0)

    navigate(trimmedSearch ? `/movies?search=${encodeURIComponent(trimmedSearch)}` : '/movies')
 }

  return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5'>
      <Link to='/' className='max-md:flex-1'>
        <img src={assets.logo} alt="" className='w-44 md:w-52 h-auto'/>
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>

        <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={()=> setIsOpen(!isOpen)}/>

        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/'>Home</Link>
        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/movies'>Movies</Link>
        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/my-bookings'>My Bookings</Link>
        {favoriteMovies.length > 0 && <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/favorite'>Favorites</Link>}
      </div>

    <div className='flex items-center gap-4'>
        <form onSubmit={submitSearch} className={`flex items-center overflow-hidden rounded-full border border-gray-300/20 bg-black/70 md:bg-white/10 backdrop-blur transition-all duration-300 ${isSearchOpen ? 'w-52 md:w-72 px-4 py-2' : 'w-0 px-0 py-0 border-transparent'}`}>
          <input
            type='text'
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Search movies'
            className='w-full bg-transparent text-sm outline-none placeholder:text-gray-400'
          />
        </form>
        <button
          type='button'
          onClick={() => {
            if (isSearchOpen && searchTerm.trim()) {
              navigate(`/movies?search=${encodeURIComponent(searchTerm.trim())}`)
              setIsSearchOpen(false)
              scrollTo(0, 0)
              return
            }

            setIsSearchOpen((prev) => !prev)
            if (isSearchOpen) {
              setSearchTerm('')
            }
          }}
          className='w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition cursor-pointer'
          aria-label='Search movies'
        >
          <SearchIcon className='w-5 h-5'/>
        </button>
        {
            !user ? (
                <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>Login</button>
            ) : (
                <UserButton>
                    <UserButton.MenuItems>
                        <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=> navigate('/my-bookings')}/>
                    </UserButton.MenuItems>
                </UserButton>
            )
        }
        
    </div>

    <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={()=> setIsOpen(!isOpen)}/>

    </div>
  )
}

export default Navbar
