import React, { useState } from 'react';
import AddRoomForm from '../../../components/Forms/AddRoomForm';
import useAuth from '../../../hooks/useAuth';
import { imageUpload } from '../../../api/utils/imageUpload';
import { useMutation } from '@tanstack/react-query';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useToast from '../../../hooks/useToast';
import { useNavigate } from 'react-router-dom';

const AddRoom = () => {
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();
  const [successToast, errorToast] = useToast();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [imgPreview, setImgPreview] = useState();
  const [imgText, setImgText] = useState('Upload Image');
  const [dates, setDates] = useState({
    startDate: new Date(),
    endDate: null,
    key: 'selection',
  });

  const { mutateAsync } = useMutation({
    mutationFn: async (roomData) => {
      const { data } = axiosSecure.post('/room', roomData);
      return data;
    },
    onSuccess: () => {
      setLoading(false);
      successToast('Data saved successfully');
      console.log('Data saved successfully');
      navigate('/dashboard/my-listings');
    },
  });

  const datesHandler = (item) => {
    console.log(item);
    setDates(item.selection);
  };

  // form handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      console.log(formData);

      // post data to server to save in db
      await mutateAsync(formData);
    } catch (error) {
      setLoading(false);
      errorToast(error.message);
      console.log(error);
    }
  };

  // handle image change
  const handleImageChange = (image) => {
    setImgPreview(URL.createObjectURL(image));
    setImgText(image.name);
  };
  return (
    <div>
      {/* FORM */}
      <AddRoomForm
        dates={dates}
        datesHandler={datesHandler}
        handleSubmit={handleSubmit}
        imgPreview={imgPreview}
        handleImageChange={handleImageChange}
        imgText={imgText}
        loading={loading}
      />
    </div>
  );
};

export default AddRoom;
