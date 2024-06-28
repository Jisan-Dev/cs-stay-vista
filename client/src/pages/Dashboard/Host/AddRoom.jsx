import React, { useState } from 'react';
import AddRoomForm from '../../../components/Forms/AddRoomForm';
import useAuth from '../../../hooks/useAuth';
import { imageUpload } from '../../../api/utils/imageUpload';

const AddRoom = () => {
  const { user } = useAuth();
  const [imgPreview, setImgPreview] = useState();
  const [imgText, setImgText] = useState('Upload Image');
  const [dates, setDates] = useState({
    startDate: new Date(),
    endDate: null,
    key: 'selection',
  });

  const datesHandler = (item) => {
    console.log(item);
    setDates(item.selection);
  };

  // form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const formData = Object.fromEntries(form.entries());
    formData.host = {
      name: user?.displayName,
      image: user?.photoURL,
      email: user?.email,
    };
    formData.from = dates.startDate;
    formData.to = dates.endDate;

    try {
      const image_url = await imageUpload(formData.image);
      formData.image = image_url;
    } catch (error) {
      console.log(error);
    }
    console.log(formData);
  };

  // handle image change
  const handleImageChange = (image) => {
    setImgPreview(URL.createObjectURL(image));
    setImgText(image.name);
  };
  return (
    <div>
      {/* FORM */}
      <AddRoomForm dates={dates} datesHandler={datesHandler} handleSubmit={handleSubmit} imgPreview={imgPreview} handleImageChange={handleImageChange} imgText={imgText} />
    </div>
  );
};

export default AddRoom;
