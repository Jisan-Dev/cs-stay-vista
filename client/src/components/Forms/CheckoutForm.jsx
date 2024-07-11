import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import './CheckoutForm.css';
import { useEffect, useState } from 'react';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import useAuth from '../../hooks/useAuth';
import { ImSpinner9 } from 'react-icons/im';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import useToast from '../../hooks/useToast';

const CheckoutForm = ({ closeModal, bookingInfo, refetch }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [successToast, errorToast] = useToast();
  const axiosSecure = useAxiosSecure();
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    // fetch client secret
    if (bookingInfo?.price && bookingInfo?.price > 0) {
      const price = (bookingInfo?.price).toFixed(2);
      getClientSecret(price);
    }
  }, [bookingInfo?.price]);

  const getClientSecret = async (price) => {
    const { data } = await axiosSecure.post('/stripe/create-payment-intent', { price });
    console.log(data);
    setClientSecret(data.clientSecret);
  };

  const handleSubmit = async (event) => {
    // Block native form submission.
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }

    // Get a reference to a mounted CardElement. Elements knows how
    // to find your CardElement because there can only ever be one of
    // each type of element.
    const card = elements.getElement(CardElement);

    if (card == null) {
      return;
    }

    // Use your card Element with other Stripe.js APIs
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card,
    });

    if (error) {
      console.log('[error]', error);
      setCardError(error.message);
      setProcessing(false);
    } else {
      console.log('[PaymentMethod]', paymentMethod);
      setCardError('');
    }

    // confirm payment
    const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
        billing_details: {
          name: user?.displayName || 'anonymous',
          email: user?.email || 'anonymous',
        },
      },
    });
    if (confirmError) {
      console.log('[confirmError]', confirmError);
      setCardError(confirmError.message);
      setProcessing(false);
    } else {
      console.log(paymentIntent);
      setProcessing(false);
      setTransactionId(paymentIntent.id);

      if (paymentIntent.status === 'succeeded') {
        // create payment info obj
        const paymentInfo = {
          ...bookingInfo,
          roomId: bookingInfo._id,
          transactionId: paymentIntent.id,
          date: new Date(),
        };
        delete paymentInfo._id;
        console.log('[paymentInfo]', paymentInfo);

        try {
          // now save the payment in bookingsCollection (db) and change the booked room's booked property to true
          const { data } = await axiosSecure.post('/booking', paymentInfo);
          console.log(data);
          refetch();
          closeModal();
          // successToast('Payment successful. Booking confirmed');
          Swal.fire({
            title: `CONGRATS!`,
            html: `<strong> Your room has been booked </br> successfully!</strong>`,
            icon: 'success',
            confirmButtonColor: '#F43F5E',
          });
          navigate('/dashboard/my-bookings');
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
        <div className="flex mt-2 justify-around">
          <button
            disabled={!stripe || !clientSecret || processing || transactionId}
            type="submit"
            className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {processing ? <ImSpinner9 size={24} className="animate-spin m-auto" /> : `Pay ${bookingInfo?.price}`}
          </button>
          <button
            onClick={() => {
              closeModal();
            }}
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
            No
          </button>
        </div>
      </form>
      {transactionId && (
        <p className="text-lime-600">
          Payment confirmed. Your transaction id is : <strong> {transactionId} </strong>
        </p>
      )}
      {cardError && <p className="text-red-500">{cardError}</p>}
    </>
  );
};

export default CheckoutForm;
