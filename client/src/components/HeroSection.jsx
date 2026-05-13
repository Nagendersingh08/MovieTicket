import React from 'react'
import { ArrowRight, CalendarIcon, ClockIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import timeFormat from '../lib/timeFormat'

const HeroSection = () => {
  const navigate = useNavigate()

  const heroMovie = {
    title: 'Crime 101',
    genres: 'Crime | Drama | Mystery & Thriller',
    releaseYear: '2026',
    runtime: timeFormat(140),
    overview: "An elusive jewel thief operating along the 101 freeway pushes a relentless detective and a desperate insurance broker into a high-stakes game where nobody gets out clean."
  }

  const heroImage = 'https://cdn.moviefone.com/admin-uploads/highlights/images/crime-101-chris-hemsworth_1761237667.webp'

  return (
    <div
      className='relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 h-screen bg-cover bg-[center_right]'
      style={{ backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.72) 34%, rgba(0, 0, 0, 0.28) 100%), url("${heroImage}")` }}
    >
      <span className='mt-20 rounded-full border border-primary/30 bg-primary/12 px-4 py-1 text-sm font-medium text-primary'>
        Featured Now
      </span>

      <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>
        {heroMovie.title}
      </h1>

      <div className='flex flex-wrap items-center gap-4 text-gray-300'>
        <span>{heroMovie.genres}</span>
        <div className='flex items-center gap-1'>
          <CalendarIcon className='w-4.5 h-4.5'/> {heroMovie.releaseYear}
        </div>
        <div className='flex items-center gap-1'>
          <ClockIcon className='w-4.5 h-4.5'/> {heroMovie.runtime}
        </div>
      </div>

      <p className='max-w-md text-gray-300'>
        {heroMovie.overview}
      </p>

      <button
        onClick={() => {
          navigate(`/movies?search=${encodeURIComponent(heroMovie.title)}`)
          scrollTo(0, 0)
        }}
        className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
      >
        Book Now
        <ArrowRight className="w-5 h-5"/>
      </button>
    </div>
  )
}

export default HeroSection
