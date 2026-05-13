import React from 'react'
import MovieCard from '../components/MovieCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import { useSearchParams } from 'react-router-dom'

const Movies = () => {

  const { shows } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchTerm = searchParams.get('search')?.trim() || ''

  const filteredShows = shows.filter((movie) => {
    if (!searchTerm) return true

    const normalizedSearch = searchTerm.toLowerCase()
    const title = movie.title?.toLowerCase() || ''
    const genres = movie.genres?.map((genre) => genre.name.toLowerCase()).join(' ') || ''
    const overview = movie.overview?.toLowerCase() || ''

    return title.includes(normalizedSearch) || genres.includes(normalizedSearch) || overview.includes(normalizedSearch)
  })

  return shows.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>

      <BlurCircle top="150px" left="0px"/>
      <BlurCircle bottom="50px" right="50px"/>

      <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between my-4'>
        <div>
          <h1 className='text-lg font-medium'>{searchTerm ? `Search Results for "${searchTerm}"` : 'Now Showing'}</h1>
          <p className='text-sm text-gray-400 mt-1'>{filteredShows.length} movie{filteredShows.length === 1 ? '' : 's'} found</p>
        </div>

        <div className='flex items-center gap-3 max-w-md'>
          <input
            type='text'
            value={searchTerm}
            onChange={(event) => {
              const value = event.target.value
              if (value.trim()) {
                setSearchParams({ search: value })
              } else {
                setSearchParams({})
              }
            }}
            placeholder='Search by title, genre, or story'
            className='w-full rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm outline-none'
          />
        </div>
      </div>

      {filteredShows.length > 0 ? (
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {filteredShows.map((movie)=> (
          <MovieCard movie={movie} key={movie._id}/>
        ))}
      </div>
      ) : (
        <div className='bg-primary/8 border border-primary/20 rounded-2xl p-6 max-w-2xl'>
          <p className='font-medium'>No movies matched your search.</p>
          <p className='text-sm text-gray-400 mt-1'>Try a different title, genre, or a broader keyword.</p>
        </div>
      )}
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No movies available</h1>
    </div>
  )
}

export default Movies
