import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useState } from 'react';
import DeleteModal from '../../Modal/DeleteModal';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useToast from '../../../hooks/useToast';
import { useMutation } from '@tanstack/react-query';

const BookingDataRow = ({ booking, refetch }) => {
  const [successToast, errorToast] = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const axiosSecure = useAxiosSecure();
  const closeModal = () => {
    setIsOpen(false);
  };

  // delete
  const { mutateAsync } = useMutation({
    mutationFn: async (id) => {
      const { data } = await axiosSecure.delete(`/bookings/${id}`);
      return data;
    },
    onSuccess: async (data) => {
      console.log(data);
      refetch();
      successToast('Booking deleted successfully');

      // Change Room's isBooked property back to false
      await axiosSecure.patch(`/room/status/${booking.roomId}`, { isBooked: false });
    },
  });

  const handleDelete = async (id) => {
    console.log('[from bookingDataRow component]', id);
    try {
      await mutateAsync(id);
    } catch (error) {
      console.log(error);
      errorToast('Failed to delete booking');
    }
  };
  return (
    <tr>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="block relative">
              <img alt="profile" src={booking?.image} className="mx-auto object-cover rounded h-10 w-15 " />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-gray-900 whitespace-no-wrap">{booking?.title}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="block relative">
              <img alt="profile" src={booking?.host?.image} className="mx-auto object-cover rounded h-10 w-15 " />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-gray-900 whitespace-no-wrap">{booking?.host?.name}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">${booking?.price}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{format(new Date(booking?.from), 'd/MM/yyyy')}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <p className="text-gray-900 whitespace-no-wrap">{format(new Date(booking?.to), 'd/MM/yyyy')}</p>
      </td>
      <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
        <span onClick={() => setIsOpen(true)} className="relative cursor-pointer inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
          <span aria-hidden="true" className="absolute inset-0 bg-red-200 opacity-50 rounded-full"></span>
          <span className="relative">Cancel</span>
        </span>
        <DeleteModal isOpen={isOpen} closeModal={closeModal} handleDelete={handleDelete} id={booking?._id} />
      </td>
    </tr>
  );
};

BookingDataRow.propTypes = {
  booking: PropTypes.object,
  refetch: PropTypes.func,
};

export default BookingDataRow;
