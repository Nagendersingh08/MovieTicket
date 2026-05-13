import React, { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '@clerk/clerk-react'

const Loading = () => {

  const { nextUrl } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { axios } = useAppContext()
  const { getToken, isLoaded } = useAuth()

  useEffect(()=>{
    const verifyAndRedirect = async () => {
      const sessionId = searchParams.get('session_id')
      const bookingId = searchParams.get('bookingId')

      if (nextUrl === 'my-bookings' && sessionId && bookingId && isLoaded) {
        try {
          const token = await getToken()

          if (token) {
          await axios.post('/api/booking/verify-payment', {
            sessionId,
            bookingId
          }, {
              headers: { Authorization: `Bearer ${token}` }
            })
          }
        } catch (error) {
          console.log(error)
        }
      }

      navigate('/' + nextUrl)
    }

    if(nextUrl){
      const timeout = setTimeout(() => {
        verifyAndRedirect()
      }, isLoaded ? 1500 : 2500)

      return () => clearTimeout(timeout)
    }
  },[axios, getToken, isLoaded, navigate, nextUrl, searchParams])

  return (
    <div className='flex justify-center items-center h-[80vh]'>
        <div className='animate-spin rounded-full h-14 w-14 border-2 border-t-primary'></div>
    </div>
  )
}

export default Loading
