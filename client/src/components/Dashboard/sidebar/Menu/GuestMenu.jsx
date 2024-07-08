import { BsFingerprint } from 'react-icons/bs';
import { GrUserAdmin } from 'react-icons/gr';
import MenuItem from './/MenuItem';
import useRole from '../../../../hooks/useRole';
import HostRequestModal from '../../../Modal/HostRequestModal';
import { useState } from 'react';
import useAuth from '../../../../hooks/useAuth';
import useAxiosSecure from '../../../../hooks/useAxiosSecure';
import useToast from '../../../../hooks/useToast';

const GuestMenu = () => {
  const [role] = useRole();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const axiosSecure = useAxiosSecure();
  const [successToast, errorToast] = useToast();

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const modalHandler = async () => {
    console.log('I want to be a host!');
    try {
      const currentUser = {
        email: user?.email,
        role: 'guest',
        status: 'Requested',
      };
      const { data } = await axiosSecure.put('/user', currentUser);
      console.log(data);
      if (data?.modifiedCount > 0) {
        successToast('Host Request Sent! Please wait for admin approval.');
      } else {
        successToast('Your request is already in pending!');
      }
    } catch (error) {
      console.log(error);
      errorToast('Failed to send host request. Please try again.');
    } finally {
      closeModal();
    }
  };

  return (
    <>
      <MenuItem icon={BsFingerprint} label="My Bookings" address="my-bookings" />

      {role === 'guest' && (
        <div
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 mt-5  transition-colors duration-300 transform text-gray-600  hover:bg-gray-300   hover:text-gray-700 cursor-pointer">
          <GrUserAdmin className="w-5 h-5" />

          <span className="mx-4 font-medium">Become A Host</span>
        </div>
      )}
      <HostRequestModal closeModal={closeModal} isOpen={isModalOpen} modalHandler={modalHandler} />
    </>
  );
};

export default GuestMenu;
