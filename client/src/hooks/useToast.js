import toast from 'react-hot-toast';

const useToast = () => {
  const successToast = (message) => {
    toast.success(message, {
      style: {
        borderRadius: '10px',
        background: '#F6536D',
        color: '#fff',
      },
    });
  };

  const errorToast = (message) => {
    toast.error(message, {
      style: {
        borderRadius: '10px',
        background: '#F6536D',
        color: '#fff',
      },
    });
  };

  return [successToast, errorToast];
};

export default useToast;
