import React, { useState } from 'react';
import AddRoomForm from '../../../components/Forms/AddRoomForm';

const AddRoom = () => {
  const [dates, setDates] = useState({
    startDate: new Date(),
    endDate: null,
    key: 'selection',
  });

  const datesHandler = (item) => {
    console.log(item);
    setDates(item.selection);
  };
  return (
    <div>
      {/* FORM */}
      <AddRoomForm dates={dates} datesHandler={datesHandler} />
    </div>
  );
};

export default AddRoom;
