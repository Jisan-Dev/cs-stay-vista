import PropTypes from 'prop-types';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from '@headlessui/react';
import { Fragment, useState } from 'react';
import UpdateRoomForm from '../Forms/UpdateRoomForm';
import useAxiosSecure from '../../hooks/useAxiosSecure';
import { imageUpload } from '../../api/utils/imageUpload';
import useToast from '../../hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const UpdateRoomModal = ({ setIsEditModalOpen, isOpen, room, refetch }) => {
  // // Get QueryClient from the context
  const queryClient = useQueryClient();
  queryClient.invalidateQueries({ queryKey: ['room'] });
  const axiosSecure = useAxiosSecure();
  const [loading, setLoading] = useState(false);
  const [successToast, errorToast] = useToast();
  const [roomData, setRoomData] = useState(room);
  const [dates, setDates] = useState({
    startDate: new Date(room?.from),
    endDate: new Date(room?.to),
    key: 'selection',
  });

  // date range handler
  const handleDates = (item) => {
    setDates(item.selection);
    setRoomData({ ...roomData, from: item.selection.startDate, to: item.selection.endDate });
  };

  // handle image update
  const handleImage = async (image) => {
    setLoading(true);
    try {
      const image_url = await imageUpload(image);
      console.log(image_url);
      setRoomData({ ...roomData, image: image_url });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorToast(error.message || 'Something went wrong!');
    }
  };

  const { mutateAsync } = useMutation({
    mutationKey: ['room', room?._id],
    mutationFn: async (roomData) => {
      const { data } = await axiosSecure.put(`/room/update/${room?._id}`, roomData);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['room', room?._id] });
      console.log(data);
      refetch();
      setIsEditModalOpen(false);
      successToast('Room updated successfully!');
    },
    onError: (error) => {
      console.log(error);
      errorToast(error.message || 'Something went wrong!');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatedRoomData = Object.assign({}, roomData);
    delete updatedRoomData._id;
    console.log(updatedRoomData);
    try {
      // const { data } = await axiosSecure.put(`/room/update/${room?._id}`, updatedRoomData);
      // console.log(data);
      await mutateAsync(updatedRoomData);
      // refetch();
      setLoading(false);
      // setIsEditModalOpen(false);
      // successToast('Rome updated successfully!');
    } catch (error) {
      // console.log(error);
      setLoading(false);
      // errorToast(error.message || 'Something went wrong!');
    }
  };
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95">
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle as="h3" className="text-lg font-medium text-center leading-6 text-gray-900">
                  Update Room Info
                </DialogTitle>
                <div className="mt-2 w-full">
                  {/* Update room form */}
                  <UpdateRoomForm handleSubmit={handleSubmit} dates={dates} handleDates={handleDates} handleImage={handleImage} roomData={roomData} setRoomData={setRoomData} />
                </div>
                <hr className="mt-8 " />
                <div className="mt-2 ">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

UpdateRoomModal.propTypes = {
  setIsEditModalOpen: PropTypes.func,
  isOpen: PropTypes.bool,
};

export default UpdateRoomModal;
