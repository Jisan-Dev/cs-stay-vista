import PropTypes from 'prop-types';
import Button from '../Shared/Button/Button';
import { DateRange } from 'react-date-range';
import { useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import BookingModal from '../Modal/BookingModal';
import useAuth from '../../hooks/useAuth';

const RoomReservation = ({ room, refetch }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState([
    {
      startDate: new Date(room?.from),
      endDate: new Date(room?.to),
      key: 'selection',
    },
  ]);

  const closeModal = () => {
    setIsOpen(false);
  };

  const totalDays = parseInt(differenceInCalendarDays(room?.to, room?.from));
  const totalPrice = totalDays * room?.price;
  console.log(totalDays, totalPrice);

  return (
    <div className="rounded-xl border-[1px] border-neutral-200 overflow-hidden bg-white">
      <div className="flex items-center gap-1 p-4">
        <div className="text-2xl font-semibold">$ {room?.price}</div>
        <div className="font-light text-neutral-600">night</div>
        {/* <div className="font-light text-neutral-600">
          from: {new Date(room?.from).toDateString()} - to: {new Date(room?.to).toDateString()}
        </div> */}
      </div>
      <hr />
      <div className="flex justify-center">
        {/* Calender */}
        <DateRange
          rangeColors={['#F6536D']}
          showDateDisplay={false}
          onChange={() =>
            setState([
              {
                startDate: new Date(room?.from),
                endDate: new Date(room?.to),
                key: 'selection',
              },
            ])
          }
          moveRangeOnFirstSelection={false}
          ranges={state}
        />
        ;
      </div>
      <hr />
      <div onClick={() => setIsOpen(true)} className="p-4">
        <Button disabled={room?.isBooked} label={room?.isBooked ? 'Already Booked' : 'Reserve'} />
      </div>
      {/* Modal */}
      <BookingModal
        isOpen={isOpen}
        closeModal={closeModal}
        bookingInfo={{ ...room, price: totalPrice, guest: { name: user?.displayName, email: user?.email, image: user?.photoURL } }}
        refetch={refetch}
      />
      <hr />
      <div className="p-4 flex items-center justify-between font-semibold text-lg">
        <div>Total</div>
        <div>${totalPrice}</div>
      </div>
    </div>
  );
};

RoomReservation.propTypes = {
  room: PropTypes.object,
};

export default RoomReservation;
