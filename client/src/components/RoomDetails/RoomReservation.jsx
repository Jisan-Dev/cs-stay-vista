import PropTypes from 'prop-types';
import Button from '../Shared/Button/Button';
import { DateRange } from 'react-date-range';
import { useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';

const RoomReservation = ({ room }) => {
  const [state, setState] = useState([
    {
      startDate: new Date(room?.from),
      endDate: new Date(room?.to),
      key: 'selection',
    },
  ]);

  const totalDays = parseInt(differenceInCalendarDays(room?.to, room?.from));
  const totalPrice = totalDays * room?.price;
  console.log(totalDays, totalPrice);

  return (
    <div className="rounded-xl border-[1px] border-neutral-200 overflow-hidden bg-white">
      <div className="flex items-center gap-1 p-4">
        <div className="text-2xl font-semibold">$ {room?.price}</div>
        <div className="font-light text-neutral-600">night</div>
      </div>
      <hr />
      <div className="flex justify-center">
        {/* Calender */}
        <DateRange
          rangeColors={['#F6536D']}
          showDateDisplay={false}
          onChange={(item) =>
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
      <div className="p-4">
        <Button label={'Reserve'} />
      </div>
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
