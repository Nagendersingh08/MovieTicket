import React, { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import { Link } from 'react-router-dom'

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY

  const { axios, getToken, user, image_base_url} = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getMyBookings = async () =>{
    try {
      const {data} = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
        if (data.success) {
          setBookings(data.bookings)
        }

    } catch (error) {
      console.log(error)
    }
    setIsLoading(false)
  }

  useEffect(()=>{
    if(user){
      getMyBookings()
    } else {
      setIsLoading(false)
    }
    
  },[user])

  useEffect(() => {
    if (!user || bookings.length === 0 || !bookings.some((item) => !item.isPaid)) {
      return
    }

    const interval = setInterval(() => {
      getMyBookings()
    }, 4000)

    return () => clearInterval(interval)
  }, [user, bookings])


  if (isLoading) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
        <BlurCircle top="100px" left="100px"/>
        <div>
          <BlurCircle bottom="0px" left="600px"/>
        </div>
        <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>
        <p className='text-gray-400'>Login to see the tickets you have booked.</p>
      </div>
    )
  }

  return (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top="100px" left="100px"/>
      <div>
        <BlurCircle bottom="0px" left="600px"/>
      </div>
      <div className='mb-4'>
        <h1 className='text-lg font-semibold'>My Bookings</h1>
        <p className='text-sm text-gray-400'>Total tickets booked: {bookings.reduce((total, item) => total + item.bookedSeats.length, 0)}</p>
      </div>

      {bookings.length === 0 && (
        <div className='bg-primary/8 border border-primary/20 rounded-lg mt-4 p-5 max-w-3xl text-gray-300'>
          <p className='font-medium'>No bookings yet.</p>
          <p className='text-sm text-gray-400 mt-1'>Your booked movie tickets will appear here.</p>
        </div>
      )}

      {bookings.map((item,index)=>(
        <div key={index} className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>
          <div className='flex flex-col md:flex-row'>
            <img src={image_base_url + item.show.movie.poster_path} alt="" className='md:max-w-45 aspect-video h-auto object-cover object-bottom rounded'/>
            <div className='flex flex-col p-4'>
              <p className='text-lg font-semibold'>{item.show.movie.title}</p>
              <p className='text-gray-400 text-sm'>{timeFormat(item.show.movie.runtime)}</p>
              <p className='text-gray-400 text-sm mt-auto'>{dateFormat(item.show.showDateTime)}</p>
            </div>
          </div>

          <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
            <div className='flex items-center gap-4'>
              <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
              {item.isPaid ? (
                <span className='bg-green-500/15 text-green-400 border border-green-500/30 px-4 py-1.5 mb-3 text-sm rounded-full font-medium'>
                  Paid
                </span>
              ) : (
                <Link to={item.paymentLink} className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer'>
                  Pay Now
                </Link>
              )}
            </div>
            <div className='text-sm'>
              <p><span className='text-gray-400'>Status:</span> {item.isPaid ? 'Paid' : 'Payment Pending'}</p>
              <p><span className='text-gray-400'>Total Tickets:</span> {item.bookedSeats.length}</p>
              <p><span className='text-gray-400'>Seat Number:</span> {item.bookedSeats.join(", ")}</p>
            </div>
          </div>

        </div>
      ))}

    </div>
  )
}

export default MyBookings
